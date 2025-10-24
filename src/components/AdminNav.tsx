import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export default function AdminNav() {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Admin Panel
        </Typography>
        <Box>
          <Button color="inherit" component={RouterLink} to="/admin/dashboard">
            Dashboard
          </Button>
          <Button color="inherit" component={RouterLink} to="/admin/menu">
            Menu
          </Button>
          <Button color="inherit" component={RouterLink} to="/admin/analytics">
            Analytics
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
