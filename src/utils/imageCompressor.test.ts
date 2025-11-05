import { describe, it, expect, vi } from 'vitest';
import { compressImage } from './imageCompressor';
import imageCompression from 'browser-image-compression';

// Mock the browser-image-compression library
vi.mock('browser-image-compression', () => ({
  default: vi.fn(),
}));

const mockedImageCompression = imageCompression as vi.Mock;

describe('compressImage Utility', () => {

  const createMockFile = (name: string, size: number, type: string): File => {
    const file = new Blob(['a'.repeat(size)], { type });
    return new File([file], name, { type });
  };

  it('should call imageCompression with the correct options', async () => {
    const mockFile = createMockFile('test.jpg', 2 * 1024 * 1024, 'image/jpeg');
    const compressedMockFile = createMockFile('compressed.jpg', 400 * 1024, 'image/jpeg');

    mockedImageCompression.mockResolvedValue(compressedMockFile);

    await compressImage(mockFile);

    expect(mockedImageCompression).toHaveBeenCalledWith(mockFile, {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
    });
  });

  it('should return the compressed file on successful compression', async () => {
    const mockFile = createMockFile('test.png', 1.5 * 1024 * 1024, 'image/png');
    const compressedMockFile = createMockFile('compressed.png', 350 * 1024, 'image/png');

    mockedImageCompression.mockResolvedValue(compressedMockFile);

    const result = await compressImage(mockFile);

    expect(result).toBe(compressedMockFile);
  });

  it('should return the original file if compression fails', async () => {
    const mockFile = createMockFile('test.gif', 3 * 1024 * 1024, 'image/gif');
    const mockError = new Error('Compression failed');

    mockedImageCompression.mockRejectedValue(mockError);

    // Spy on console.error to ensure it's called
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await compressImage(mockFile);

    expect(result).toBe(mockFile);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error during image compression:', mockError);

    consoleErrorSpy.mockRestore();
  });
});
