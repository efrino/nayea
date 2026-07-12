import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';

// Below this size, compression isn't worth the wait — just upload as-is.
export const COMPRESSION_THRESHOLD_BYTES = 8 * 1024 * 1024; // 8MB

// Safety net: if ffmpeg.wasm loading/transcoding hangs (slow network, worker
// init issue, unsupported browser, etc.) we must not leave the admin stuck
// on a spinner forever — bail out and upload the original file instead.
const COMPRESSION_TIMEOUT_MS = 120_000; // 2 minutes

let ffmpegInstance = null;
let loadPromise = null;

async function getFFmpeg() {
  if (ffmpegInstance) return ffmpegInstance;
  if (!loadPromise) {
    loadPromise = (async () => {
      const ffmpeg = new FFmpeg();
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      ffmpegInstance = ffmpeg;
      return ffmpeg;
    })();
  }
  return loadPromise;
}

/**
 * Compress a video file in-browser with ffmpeg.wasm before upload.
 * Uses H.264 at CRF 28 (visually near-lossless, cuts file size
 * significantly) and caps resolution at 1280px on the long edge —
 * plenty for product video previews. Falls back to the original file
 * if compression fails or doesn't actually shrink it.
 *
 * @param {File} file
 * @param {(percent: number) => void} [onProgress]
 * @returns {Promise<File>}
 */
export async function compressVideo(file, onProgress) {
  let timeoutId;
  const timeoutPromise = new Promise((resolve) => {
    timeoutId = setTimeout(() => {
      console.error(`Video compression timed out after ${COMPRESSION_TIMEOUT_MS}ms, uploading original file.`);
      resolve(file);
    }, COMPRESSION_TIMEOUT_MS);
  });

  const result = await Promise.race([
    runCompression(file, onProgress),
    timeoutPromise,
  ]);
  clearTimeout(timeoutId);
  return result;
}

async function runCompression(file, onProgress) {
  try {
    const ffmpeg = await getFFmpeg();

    const handleProgress = ({ progress }) => {
      if (onProgress) onProgress(Math.min(100, Math.round(progress * 100)));
    };
    ffmpeg.on('progress', handleProgress);

    const ext = file.name.match(/\.[^.]+$/)?.[0] || '.mp4';
    const inputName = `input${ext}`;
    const outputName = 'output.mp4';

    await ffmpeg.writeFile(inputName, await fetchFile(file));

    await ffmpeg.exec([
      '-i', inputName,
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '28',
      '-vf', "scale='min(1280,iw)':-2",
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      outputName,
    ]);

    const data = await ffmpeg.readFile(outputName);
    const compressedBlob = new Blob([data.buffer], { type: 'video/mp4' });

    await ffmpeg.deleteFile(inputName).catch(() => {});
    await ffmpeg.deleteFile(outputName).catch(() => {});
    ffmpeg.off('progress', handleProgress);

    if (compressedBlob.size >= file.size) return file;

    return new File(
      [compressedBlob],
      file.name.replace(/\.[^.]+$/, '.mp4'),
      { type: 'video/mp4' }
    );
  } catch (err) {
    console.error('Video compression failed, uploading original file:', err);
    return file;
  }
}
