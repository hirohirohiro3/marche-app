
import { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, Container, Box, IconButton, Menu, MenuItem, Avatar } from '@mui/material';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import AccountCircle from '@mui/icons-material/AccountCircle';

export default function AdminLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    signOut(auth).then(() => navigate('/login'));
    handleClose();
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            マルシェ管理画面
          </Typography>
          <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
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
            <Button color="inherit" component={Link} to="/admin/settings/payment">
              決済設定
            </Button>
            <Button color="inherit" component={Link} to="/admin/settings/qrcode">
              QRコード設定
            </Button>
            <Button
              color="inherit"
              component={Link}
              to={`/menu/${user?.uid}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              顧客画面を確認
            </Button>
          </Box>
          <Box sx={{ flexGrow: 0 }}>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32 }}>
                <AccountCircle />
              </Avatar>
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem disabled>{user?.email}</MenuItem>
              <MenuItem
                component="a"
                href="https://docs.google.com/forms/d/e/1FAIpQLSdnG4UzAHJamOHofSIvkcd7nmOJAHadO2aEupUOiDW6YwdELQ/viewform"
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleClose}
              >
                バグ報告・改善要望
              </MenuItem>
              <MenuItem onClick={handleLogout}>ログアウト</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Outlet />
      </Container>
    </>
  );
}
