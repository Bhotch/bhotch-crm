/**
 * Image Processing Utilities
 * Handles image validation, optimization, and transformations
 */

/**
 * Validate image quality and format
 */
export const validateImage = async (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      reject(new Error('File must be an image'));
      return;
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      reject(new Error('Image must be less than 10MB'));
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Check minimum dimensions
      if (img.width < 800 || img.height < 600) {
        reject(new Error('Image must be at least 800x600 pixels'));
        return;
      }

      resolve({
        width: img.width,
        height: img.height,
        aspectRatio: img.width / img.height,
        size: file.size,
        type: file.type,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
};

/**
 * Compress and optimize image
 */
export const compressImage = async (file, maxWidth = 2048, quality = 0.9) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement('canvas');
      let { width, height } = img;

      // Scale down if necessary
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve({
              file: compressedFile,
              url: URL.createObjectURL(blob),
              width,
              height,
            });
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
};

/**
 * Check if image is blurry (basic blur detection)
 */
export const detectBlur = async (imageElement) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = imageElement.width;
    canvas.height = imageElement.height;
    ctx.drawImage(imageElement, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Simple blur detection using edge detection
    let blurScore = 0;
    const sampleSize = 1000;

    for (let i = 0; i < sampleSize; i++) {
      const x = Math.floor(Math.random() * (canvas.width - 1));
      const y = Math.floor(Math.random() * (canvas.height - 1));
      const index = (y * canvas.width + x) * 4;

      const r1 = data[index];
      const r2 = data[index + 4];
      const diff = Math.abs(r1 - r2);

      blurScore += diff;
    }

    const avgDiff = blurScore / sampleSize;
    const isBlurry = avgDiff < 10; // Threshold for blur

    resolve({
      isBlurry,
      score: avgDiff,
      quality: isBlurry ? 'poor' : avgDiff > 30 ? 'excellent' : 'good',
    });
  });
};

/**
 * Extract dominant colors from image
 */
export const extractDominantColors = async (imageElement, numColors = 5) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Scale down for faster processing
    canvas.width = 100;
    canvas.height = 100;
    ctx.drawImage(imageElement, 0, 0, 100, 100);

    const imageData = ctx.getImageData(0, 0, 100, 100);
    const data = imageData.data;

    const colorMap = {};

    // Sample pixels
    for (let i = 0; i < data.length; i += 16) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Round to nearest 16 to reduce color variations
      const rRounded = Math.round(r / 16) * 16;
      const gRounded = Math.round(g / 16) * 16;
      const bRounded = Math.round(b / 16) * 16;

      const key = `${rRounded},${gRounded},${bRounded}`;
      colorMap[key] = (colorMap[key] || 0) + 1;
    }

    // Sort by frequency
    const sortedColors = Object.entries(colorMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, numColors)
      .map(([color]) => {
        const [r, g, b] = color.split(',').map(Number);
        return {
          rgb: `rgb(${r}, ${g}, ${b})`,
          hex: `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`,
        };
      });

    resolve(sortedColors);
  });
};

/**
 * Convert image to equirectangular format (basic implementation)
 */
export const convertToEquirectangular = async (imageElement) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // For equirectangular, we want 2:1 aspect ratio
    const targetWidth = 4096;
    const targetHeight = 2048;

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // Draw and stretch image to fit
    ctx.drawImage(imageElement, 0, 0, targetWidth, targetHeight);

    canvas.toBlob(
      (blob) => {
        resolve({
          blob,
          url: URL.createObjectURL(blob),
          width: targetWidth,
          height: targetHeight,
        });
      },
      'image/jpeg',
      0.95
    );
  });
};

/**
 * Create thumbnail from image
 */
export const createThumbnail = async (file, size = 150) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Calculate dimensions maintaining aspect ratio
      let width = size;
      let height = size;

      if (img.width > img.height) {
        height = (img.height / img.width) * size;
      } else {
        width = (img.width / img.height) * size;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(URL.createObjectURL(blob));
          } else {
            reject(new Error('Failed to create thumbnail'));
          }
        },
        'image/jpeg',
        0.8
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
};

/**
 * Detect brightness of image
 */
export const detectBrightness = async (imageElement) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = imageElement.width;
    canvas.height = imageElement.height;
    ctx.drawImage(imageElement, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    let totalBrightness = 0;
    const pixelCount = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Calculate perceived brightness
      const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
      totalBrightness += brightness;
    }

    const avgBrightness = totalBrightness / pixelCount;

    resolve({
      brightness: avgBrightness,
      quality: avgBrightness < 50 ? 'too-dark' : avgBrightness > 200 ? 'too-bright' : 'good',
      percentage: (avgBrightness / 255) * 100,
    });
  });
};
