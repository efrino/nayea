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
// drive.file (not drive.readonly): the app only ever gets access to files
// the admin explicitly selects through this picker, never blanket read
// access to their whole Drive.
const SCOPE = 'https://www.googleapis.com/auth/drive.file';

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

async function downloadDriveFile(fileId, accessToken, fileName, mimeType) {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
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
      .setIncludeFolders(false);

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
          const files = await Promise.all(
            docs.map((doc) => downloadDriveFile(doc.id, accessToken, doc.name, doc.mimeType))
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

export const isGoogleDriveConfigured = Boolean(CLIENT_ID && API_KEY);
