import { Outlet } from "react-router-dom";
import { CssBaseline } from "@mui/material";

export default function RootLayout() {
  return (
    <>
      <CssBaseline />
      <main>
        <Outlet />
      </main>
    </>
  );
}
