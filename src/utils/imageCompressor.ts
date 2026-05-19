/**
 * Compresses an image file using HTML5 Canvas.
 * Resizes the image to a maximum dimension of 1024px while maintaining aspect ratio,
 * and outputs it as a JPEG at 0.7 quality.
 * 
 * If the file is not an image (e.g., PDF), it returns the file unmodified.
 */
export function compressImage(file: File, maxDimension = 1024, quality = 0.7): Promise<File> {
  return new Promise((resolve) => {
    // Only compress image files. Bypass compression for PDF, etc.
    if (!file.type.startsWith('image/')) {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio and clamp dimensions to maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(file); // Fallback to original file on failure
        }

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Export to Blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve(file);
            }
            // Create a new File from blob with original name but new compressed format/size
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => {
        resolve(file); // Fallback to original file on failure
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      resolve(file); // Fallback to original file on failure
    };
    reader.readAsDataURL(file);
  });
}
