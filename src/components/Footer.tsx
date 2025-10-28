
import { Box, Typography, Link, Container } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) =>
          theme.palette.mode === 'light'
            ? theme.palette.grey[200]
            : theme.palette.grey[800],
      }}
    >
      <Container maxWidth="sm" sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          <Link color="inherit" component={RouterLink} to="/terms">
            利用規約
          </Link>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <Link color="inherit" component={RouterLink} to="/privacy">
            プライバシーポリシー
          </Link>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <Link color="inherit" component={RouterLink} to="/contact">
            お問い合わせ
          </Link>
        </Typography>
      </Container>
    </Box>
  );
}
