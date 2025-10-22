import { Outlet } from "react-router-dom";
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from "@mui/material";
import theme from '../theme';
import CartSummary from "../components/CartSummary";

export default function RootLayout() {
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
