/**
 * Utility for processing and compressing custom user avatar images.
 * Generates an optimized, square-cropped Base64 data URL suitable for fast
 * local storage, real-time Firestore synchronization, and responsive rendering.
 */

export interface ProcessImageOptions {
  maxSize?: number;
  quality?: number;
}

export const processImageFile = (
  file: File,
  options: ProcessImageOptions = {}
): Promise<string> => {
  const { maxSize = 256, quality = 0.85 } = options;

  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Fișierul selectat nu este o imagine validă.'));
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result !== 'string') {
        reject(new Error('Eroare la citirea fișierului.'));
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = maxSize;
          canvas.height = maxSize;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Eroare context canvas.'));
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Square center-crop math
          const srcWidth = img.width;
          const srcHeight = img.height;
          const minDim = Math.min(srcWidth, srcHeight);
          const srcX = (srcWidth - minDim) / 2;
          const srcY = (srcHeight - minDim) / 2;

          ctx.drawImage(
            img,
            srcX,
            srcY,
            minDim,
            minDim,
            0,
            0,
            maxSize,
            maxSize
          );

          // Convert to lightweight JPEG data URL
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => {
        reject(new Error('Nu s-a putut încărca imaginea selectată.'));
      };

      img.src = result;
    };

    reader.onerror = () => {
      reject(new Error('Eroare la procesarea fișierului.'));
    };

    reader.readAsDataURL(file);
  });
};
