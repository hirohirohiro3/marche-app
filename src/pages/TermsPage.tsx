
import { Container, Typography } from '@mui/material';

export default function TermsPage() {
  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" component="h1">
        利用規約
      </Typography>
      <Typography sx={{ mt: 2 }}>
        {/* TODO: Add terms of service content */}
        ここに利用規約の文章が入ります。
      </Typography>
    </Container>
  );
}
