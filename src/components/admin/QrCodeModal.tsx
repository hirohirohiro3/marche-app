import React from 'react';
import { Modal, Box, Typography, IconButton } from '@mui/material';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import CloseIcon from '@mui/icons-material/Close';

interface QrCodeModalProps {
  open: boolean;
  onClose: () => void;
}

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  textAlign: 'center',
};

const QrCodeModal: React.FC<QrCodeModalProps> = ({ open, onClose }) => {
  const menuUrl = window.location.origin + '/menu';

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="qr-code-modal-title"
      aria-describedby="qr-code-modal-description"
    >
      <Box sx={style}>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
          }}
        >
          <CloseIcon />
        </IconButton>
        <Typography id="qr-code-modal-title" variant="h6" component="h2">
          お客様用メニューページ
        </Typography>
        <Box my={2}>
          <QRCode value={menuUrl} size={256} />
        </Box>
        <Typography id="qr-code-modal-description" sx={{ mt: 2 }}>
          お客様にこのQRコードをスキャンしてもらってください。
        </Typography>
      </Box>
    </Modal>
  );
};

export default QrCodeModal;
