
import { AppBar, Toolbar, Typography, Button, Container } from '@mui/material';
import { Link, Outlet } from 'react-router-dom';

export default function AdminLayout() {
  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Marche Admin
          </Typography>
          <Button color="inherit" component={Link} to="/admin/dashboard">
            Dashboard
          </Button>
          <Button color="inherit" component={Link} to="/admin/menu">
            Menu
          </Button>
          <Button color="inherit" component={Link} to="/admin/analytics">
            Analytics
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Outlet />
      </Container>
    </>
  );
}
