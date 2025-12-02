import { Outlet, useLocation } from "react-router-dom";
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Container, Typography, Box } from "@mui/material";
import theme from '../theme';
import CartSummary from "../components/CartSummary";
import Footer from '../components/Footer';
import { useEffect } from "react";
import { signInAnonymously } from "firebase/auth";
import { auth } from "../firebase";

export default function RootLayout() {
  const location = useLocation();
  // Check if the essential Firebase config is missing.
  // Vite exposes env variables under `import.meta.env`.
  const isFirebaseConfigMissing = !import.meta.env.VITE_API_KEY;

  useEffect(() => {
    const signIn = async () => {
      // Only sign in anonymously if not already signed in
      if (!auth.currentUser) {
        try {
          await signInAnonymously(auth);
          console.log("Signed in anonymously");
        } catch (error) {
          console.error("Error signing in anonymously:", error);
        }
      }
    };
    signIn();
  }, []);

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
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Box component="main" sx={{ flexGrow: 1 }}>
          <Outlet />
        </Box>
        <Footer />
      </Box>
      {location.pathname.startsWith('/menu/') && <CartSummary />}
    </ThemeProvider>
  );
}
