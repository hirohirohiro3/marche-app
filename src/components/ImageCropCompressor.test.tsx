import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ImageCropCompressor from './ImageCropCompressor';
import imageCompression from 'browser-image-compression';

// Mock dependencies
vi.mock('browser-image-compression', () => ({
  default: vi.fn(),
}));
const mockedImageCompression = imageCompression as vi.Mock;

// Mock ReactCrop
vi.mock('react-image-crop', () => ({
  default: ({
    children,
    onComplete,
  }: {
    children: React.ReactNode;
    onComplete: (crop: any) => void;
  }) => {
    // Simulate the crop completing immediately for the test
    React.useEffect(() => {
      if (onComplete) {
        onComplete({ x: 0, y: 0, width: 100, height: 100, unit: 'px' });
      }
    }, [onComplete]);
    return <div>{children}</div>;
  },
  centerCrop: vi.fn((crop) => crop),
  makeAspectCrop: vi.fn((crop) => crop),
}));

describe('ImageCropCompressor Component', () => {
  const mockFile = new File(['dummy content'], 'test.png', { type: 'image/png' });
  const mockCompressedFile = new File(['compressed'], 'compressed.jpg', { type: 'image/jpeg' });

  beforeEach(() => {
    vi.clearAllMocks();
    mockedImageCompression.mockResolvedValue(mockCompressedFile);
    global.URL.createObjectURL = vi.fn((file) => `blob:${(file as File)?.name || 'default'}`);

    // Mock canvas logic for getCroppedImg
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      drawImage: vi.fn(),
      setTransform: vi.fn(),
    })) as any;
    HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => {
      callback(new Blob(['cropped'], { type: 'image/jpeg' }));
    });
  });

  it('renders the select file button initially', () => {
    render(<ImageCropCompressor aspect={16 / 9} onCropped={() => { }} />);
    expect(screen.getByRole('button', { name: /画像を選択/i })).toBeInTheDocument();
  });

  it('shows cropper UI when a file is selected', async () => {
    const user = userEvent.setup();
    const { container } = render(<ImageCropCompressor aspect={16 / 9} onCropped={() => { }} />);

    const input = container.querySelector('input[type="file"]')!;
    expect(input).toBeInTheDocument();

    await user.upload(input, mockFile);

    expect(await screen.findByRole('button', { name: /切り抜きを決定/i })).toBeInTheDocument();
  });

  it('calls onCropped with compressed file after crop and compress flow', async () => {
    const user = userEvent.setup();
    const onCroppedMock = vi.fn();
    const { container } = render(<ImageCropCompressor aspect={16 / 9} onCropped={onCroppedMock} />);

    // 1. User selects a file
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, mockFile);

    // 2. Cropper UI appears, user clicks "決定"
    const cropButton = await screen.findByRole('button', { name: /切り抜きを決定/i });
    await user.click(cropButton);

    // 3. Loading indicator should appear while compressing
    expect(await screen.findByRole('progressbar')).toBeInTheDocument();

    // 4. Final preview and onCropped callback should be called
    await waitFor(() => {
      // Check that compression was called with a file-like object
      expect(mockedImageCompression).toHaveBeenCalledWith(expect.any(File), expect.any(Object));
    });

    await waitFor(() => {
      // Check that the parent component receives the final, compressed file
      expect(onCroppedMock).toHaveBeenCalledWith(mockCompressedFile);
    });

    // 5. Final preview is shown
    expect(await screen.findByAltText(/Final preview/i)).toHaveAttribute('src', `blob:${mockCompressedFile.name}`);
  });
});
