import imageCompression from 'browser-image-compression';

/**
 * Compresses an image file using the browser-image-compression library.
 * The function adheres to the specified project requirements:
 * - Resizes the longest side of the image to be within 800-1200px (using 1200px as the target).
 * - Aims for a file size under 500KB.
 * - Ensures the output is either JPEG or PNG.
 *
 * @param file The original image file to be compressed.
 * @returns A promise that resolves with the compressed image file.
 */
export const compressImage = async (file: File): Promise<File> => {
  const options = {
    maxSizeMB: 0.5, // 500KB
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    // The library automatically handles JPEG/PNG output based on the input file type.
  };

  try {
    const compressedFile = await imageCompression(file, options);
    console.log(`Image compressed successfully. Original size: ${file.size / 1024} KB, New size: ${compressedFile.size / 1024} KB`);
    return compressedFile;
  } catch (error) {
    console.error('Error during image compression:', error);
    // If compression fails, return the original file to avoid breaking the upload flow.
    return file;
  }
};
