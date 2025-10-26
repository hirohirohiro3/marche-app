
import { Container, Typography } from '@mui/material';

export default function PrivacyPage() {
  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" component="h1">
        プライバシーポリシー
      </Typography>
      <Typography sx={{ mt: 2 }}>
        {/* TODO: Add privacy policy content */}
        ここにプライバシーポリシーの文章が入ります。
      </Typography>
    </Container>
  );
}
