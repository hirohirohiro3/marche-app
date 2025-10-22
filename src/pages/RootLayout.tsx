import { Outlet } from "react-router-dom";
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Container, Typography } from "@mui/material";
import theme from '../theme';
import CartSummary from "../components/CartSummary";

export default function RootLayout() {
  // Check if the essential Firebase config is missing.
  // Vite exposes env variables under `import.meta.env`.
  const isFirebaseConfigMissing = !import.meta.env.VITE_API_KEY;

  if (isFirebaseConfigMissing) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Container sx={{ py: 4 }}>
          <Typography variant="h4" color="error">
            Firebase configuration is missing.
          </Typography>
          <Typography>
            Please set up your .env.local file with the necessary VITE_ variables.
          </Typography>
        </Container>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <main>
        <Outlet />
      </main>
      <CartSummary />
    </ThemeProvider>
  );
}
