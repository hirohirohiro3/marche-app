
import { AppBar, Toolbar, Typography, Button, Container } from '@mui/material';
import { Link, Outlet } from 'react-router-dom';

export default function AdminLayout() {
  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            マルシェ管理画面
          </Typography>
          <Button color="inherit" component={Link} to="/admin/dashboard">
            ダッシュボード
          </Button>
          <Button color="inherit" component={Link} to="/admin/menu">
            メニュー管理
          </Button>
          <Button color="inherit" component={Link} to="/admin/analytics">
            売上分析
          </Button>
          <Button color="inherit" component={Link} to="/admin/options">
            オプション管理
          </Button>
          <Button
            color="inherit"
            component={Link}
            to="/menu"
            target="_blank"
            rel="noopener noreferrer"
          >
            顧客画面を確認
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Outlet />
      </Container>
    </>
  );
}
