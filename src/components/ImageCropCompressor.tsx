import 'react-image-crop/dist/ReactCrop.css';
import { useState, useRef } from 'react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { Button, Box, CircularProgress, Typography } from '@mui/material';
// import imageCompression from 'browser-image-compression';

interface ImageCropCompressorProps {
  aspect: number;
  onCropped: (imageFile: File) => void;
  initialImageUrl?: string | null;
}

// Reusable utility to get the cropped image as a File
async function getCroppedImg(
  image: HTMLImageElement,
  crop: Crop,
  fileName: string
): Promise<File | null> {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  const pixelRatio = window.devicePixelRatio;
  canvas.width = crop.width * pixelRatio;
  canvas.height = crop.height * pixelRatio;
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve(null);
          return;
        }
        resolve(new File([blob], fileName, { type: blob.type }));
      },
      'image/jpeg',
      0.95
    );
  });
}

export default function ImageCropCompressor({ aspect, onCropped, initialImageUrl }: ImageCropCompressorProps) {
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const [isLoading, setIsLoading] = useState(false);
  const [finalPreview, setFinalPreview] = useState<string | null>(initialImageUrl || null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [originalFileName, setOriginalFileName] = useState('cropped.jpg');

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined); // Makes crop preview update between images.
      const reader = new FileReader();
      reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
      reader.readAsDataURL(e.target.files[0]);
      setOriginalFileName(e.target.files[0].name);
      setFinalPreview(null); // Clear previous final preview
    }
  };

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const newCrop = makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      width,
      height
    );
    const centeredCrop = centerCrop(newCrop, width, height);
    setCrop(centeredCrop);
  }

  const handleCropAndCompress = async () => {
    if (!completedCrop || !imgRef.current) {
      return;
    }
    setIsLoading(true);

    try {
      const croppedImageFile = await getCroppedImg(imgRef.current, completedCrop, originalFileName);
      if (!croppedImageFile) {
        setIsLoading(false);
        return;
      }

      // Bypass compression for debugging
      const compressedFile = croppedImageFile;
      // const compressedFile = await imageCompression(croppedImageFile, {
      //   maxSizeMB: 0.5,
      //   maxWidthOrHeight: 1200,
      //   useWebWorker: true,
      // });

      const previewUrl = URL.createObjectURL(compressedFile);
      setFinalPreview(previewUrl);
      onCropped(compressedFile);
    } catch (error) {
      console.error('Image processing failed:', error);
    } finally {
      setIsLoading(false);
      setImgSrc(''); // Hide cropper after processing
    }
  };

  return (
    <Box>
      <Button variant="contained" component="label">
        画像を選択
        <input
          type="file"
          accept="image/*"
          onChange={onSelectFile}
          style={{
            clip: 'rect(0 0 0 0)',
            clipPath: 'inset(50%)',
            height: 1,
            overflow: 'hidden',
            position: 'absolute',
            bottom: 0,
            left: 0,
            whiteSpace: 'nowrap',
            width: 1,
          }}
          data-testid="file-input"
        />
      </Button>

      {imgSrc && (
        <Box mt={2}>
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspect}
          >
            <img ref={imgRef} alt="Crop me" src={imgSrc} onLoad={onImageLoad} style={{ maxHeight: '400px' }} />
          </ReactCrop>
          <Button variant="contained" onClick={handleCropAndCompress} sx={{ mt: 1 }}>
            切り抜きを決定
          </Button>
        </Box>
      )}

      {isLoading && <CircularProgress sx={{ display: 'block', mt: 2 }} />}

      {finalPreview && (
        <Box mt={2}>
          <Typography variant="subtitle1">最終プレビュー:</Typography>
          <img alt="Final preview" src={finalPreview} style={{ maxWidth: '100%', maxHeight: '200px', marginTop: '8px' }} />
        </Box>
      )}
    </Box>
  );
}
