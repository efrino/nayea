// Google Drive Picker — lets admin pick images/videos from their Drive.
// Picked files are downloaded client-side and returned as File objects,
// meant to be handed straight to uploadFile() (Supabase Storage) — Drive is
// only ever used as a file *source*, never as the final hosting location
// (drive.google.com links are unreliable/rate-limited for hotlinking).

import { supabase } from './supabase';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
// Optional: restrict the picker to a single Drive folder (e.g. a shared
// "Nayea Assets" folder) instead of the admin's entire Drive.
const FOLDER_ID = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID || null;
// drive.readonly (not drive.file): drive.file's per-file grant only works
// reliably for files the app itself created, or via full Drive UI
// integration — for pre-existing files in a folder *shared with* the admin
// (not owned by them), it 404s unpredictably even after the file is
// selected through the picker. drive.readonly reads anything the admin can
// already view in Drive, which is what "shared with me" actually needs.
const SCOPE = 'https://www.googleapis.com/auth/drive.readonly';

let pickerApiLoaded = false;
let cachedAccessToken = null;
let tokenExpiresAt = 0;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Gagal memuat script Google: ${src}`));
    document.head.appendChild(script);
  });
}

async function ensureGoogleScripts() {
  if (!CLIENT_ID || !API_KEY) {
    throw new Error(
      'Google Drive belum dikonfigurasi. Set VITE_GOOGLE_CLIENT_ID dan VITE_GOOGLE_API_KEY di .env, lalu restart dev server.'
    );
  }

  await Promise.all([
    loadScript('https://accounts.google.com/gsi/client'),
    loadScript('https://apis.google.com/js/api.js'),
  ]);

  if (!pickerApiLoaded) {
    await new Promise((resolve) => {
      window.gapi.load('picker', () => {
        pickerApiLoaded = true;
        resolve();
      });
    });
  }
}

async function getAccessToken() {
  if (cachedAccessToken && Date.now() < tokenExpiresAt) {
    return cachedAccessToken;
  }

  // Hint Google towards the same email the admin is logged into Nayea with,
  // so the account picker pre-selects it instead of showing a blank chooser.
  const { data } = await supabase.auth.getSession();
  const hint = data?.session?.user?.email || undefined;

  return new Promise((resolve, reject) => {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      hint,
      callback: (response) => {
        if (response.error) {
          reject(new Error(`Otorisasi Google Drive gagal: ${response.error}`));
          return;
        }
        cachedAccessToken = response.access_token;
        tokenExpiresAt = Date.now() + (response.expires_in - 60) * 1000;
        resolve(response.access_token);
      },
      error_callback: (err) => {
        reject(new Error(err?.message || 'Otorisasi Google Drive dibatalkan.'));
      },
    });
    tokenClient.requestAccessToken({ prompt: '' });
  });
}

const SHORTCUT_MIME_TYPE = 'application/vnd.google-apps.shortcut';

// Picker can return a Drive *shortcut* (a pointer, no content of its own)
// instead of the real file — happens a lot for items surfaced from a
// shared folder. A shortcut's own ID 404s on every download attempt no
// matter what headers/params are added, so resolve it to its real target
// first. shortcutDetails conveniently carries the target's resourceKey too.
async function resolveShortcut(doc, accessToken) {
  if (doc.mimeType !== SHORTCUT_MIME_TYPE) {
    return { id: doc.id, name: doc.name, mimeType: doc.mimeType, resourceKey: doc.resourceKey };
  }

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${doc.id}?fields=shortcutDetails&supportsAllDrives=true`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) {
    throw new Error(`Gagal membaca shortcut "${doc.name}" (HTTP ${res.status}).`);
  }
  const meta = await res.json();
  const targetId = meta.shortcutDetails?.targetId;
  if (!targetId) {
    throw new Error(`Shortcut "${doc.name}" tidak mengarah ke file manapun.`);
  }
  return {
    id: targetId,
    name: doc.name,
    mimeType: meta.shortcutDetails?.targetMimeType || doc.mimeType,
    resourceKey: meta.shortcutDetails?.targetResourceKey,
  };
}

async function downloadDriveFile(fileId, accessToken, fileName, mimeType, resourceKey) {
  const headers = { Authorization: `Bearer ${accessToken}` };
  // Files living in a folder shared with the admin (rather than owned by
  // them) often require their resourceKey — omitting it returns a
  // confusing 404 instead of a 403. Picker gives us this on doc.resourceKey.
  if (resourceKey) {
    headers['X-Goog-Drive-Resource-Keys'] = `${fileId}/${resourceKey}`;
  }
  // supportsAllDrives: without it, Drive API v3 routinely 404s on files that
  // live in a Shared Drive or a folder shared with (not owned by) the admin,
  // instead of returning a clearer permission error.
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`,
    { headers }
  );
  if (!res.ok) {
    throw new Error(`Gagal mengunduh "${fileName}" dari Google Drive (HTTP ${res.status}).`);
  }
  const blob = await res.blob();
  return new File([blob], fileName, { type: mimeType || blob.type });
}

/**
 * Opens the Google Drive picker restricted to images/videos, downloads
 * whatever the admin selects, and resolves to an array of File objects.
 * Resolves to [] if the admin cancels the picker.
 */
export async function pickFilesFromDrive({ multiple = true } = {}) {
  await ensureGoogleScripts();
  const accessToken = await getAccessToken();

  return new Promise((resolve, reject) => {
    const view = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS_IMAGES_AND_VIDEOS)
      .setIncludeFolders(true)
      .setSelectFolderEnabled(false);

    if (FOLDER_ID) {
      view.setParent(FOLDER_ID);
    }

    const pickerBuilder = new window.google.picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(accessToken)
      .setDeveloperKey(API_KEY)
      .setCallback(async (data) => {
        if (data.action === window.google.picker.Action.CANCEL) {
          resolve([]);
          return;
        }
        if (data.action !== window.google.picker.Action.PICKED) return;

        try {
          const docs = data.docs || [];
          const resolved = await Promise.all(docs.map((doc) => resolveShortcut(doc, accessToken)));
          const files = await Promise.all(
            resolved.map((doc) => downloadDriveFile(doc.id, accessToken, doc.name, doc.mimeType, doc.resourceKey))
          );
          resolve(files);
        } catch (err) {
          reject(err);
        }
      });

    if (multiple) pickerBuilder.enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED);

    pickerBuilder.build().setVisible(true);
  });
}

/**
 * Opens the Drive picker across all file types (Docs, Sheets, Slides, PDFs,
 * images, etc.) and resolves to link metadata only — no download. Meant for
 * bookmarking reference documents (financial reports, research) that should
 * stay live in Google Docs/Sheets rather than become a stale local copy.
 * Resolves to [] if the admin cancels the picker.
 */
export async function pickDriveDocumentLinks({ multiple = true } = {}) {
  await ensureGoogleScripts();
  const accessToken = await getAccessToken();

  return new Promise((resolve) => {
    const view = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS)
      .setIncludeFolders(true)
      .setSelectFolderEnabled(false);

    if (FOLDER_ID) {
      view.setParent(FOLDER_ID);
    }

    const pickerBuilder = new window.google.picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(accessToken)
      .setDeveloperKey(API_KEY)
      .setCallback((data) => {
        if (data.action === window.google.picker.Action.CANCEL) {
          resolve([]);
          return;
        }
        if (data.action !== window.google.picker.Action.PICKED) return;

        const docs = (data.docs || []).map((doc) => ({
          title: doc.name,
          url: doc.url,
          icon_url: doc.iconUrl,
          mime_type: doc.mimeType,
        }));
        resolve(docs);
      });

    if (multiple) pickerBuilder.enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED);

    pickerBuilder.build().setVisible(true);
  });
}

export const isGoogleDriveConfigured = Boolean(CLIENT_ID && API_KEY);
