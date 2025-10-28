import { Box, Button, Container, TextField, Typography, Alert } from '@mui/material';
import { useForm, ValidationError } from '@formspree/react';

const endpoint = import.meta.env.VITE_FORMSPREE_ENDPOINT_URL;

export default function ContactPage() {
  const [state, handleSubmit] = useForm(endpoint?.split('/').pop() || '');

  if (!endpoint) {
    return (
      <Container sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          お問い合わせ
        </Typography>
        <Alert severity="error" sx={{ mt: 2 }}>
          現在、お問い合わせフォームはご利用いただけません。設定が管理者によって行われていない可能性があります。
        </Alert>
      </Container>
    );
  }

  if (state.succeeded) {
    return (
      <Container sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          お問い合わせ
        </Typography>
        <Alert severity="success" sx={{ mt: 2 }}>
          お問い合わせありがとうございます。メッセージは正常に送信されました。
        </Alert>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 4, maxWidth: 'sm' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        お問い合わせフォーム
      </Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
        <TextField
          fullWidth
          id="name"
          name="name"
          label="お名前 (任意)"
          variant="outlined"
          margin="normal"
        />
        <TextField
          fullWidth
          id="email"
          name="email"
          type="email"
          label="返信先メールアドレス (任意)"
          variant="outlined"
          margin="normal"
        />
        <ValidationError
          prefix="Email"
          field="email"
          errors={state.errors}
        />
        <TextField
          fullWidth
          required
          id="message"
          name="message"
          label="お問い合わせ内容 (必須)"
          variant="outlined"
          margin="normal"
          multiline
          rows={6}
        />
        <ValidationError
          prefix="Message"
          field="message"
          errors={state.errors}
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          disabled={state.submitting}
        >
          送信する
        </Button>
      </Box>
    </Container>
  );
}
