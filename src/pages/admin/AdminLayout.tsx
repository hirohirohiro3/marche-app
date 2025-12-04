
import { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Button, Container, Box, IconButton, Menu, MenuItem, Avatar, CircularProgress } from '@mui/material';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import AccountCircle from '@mui/icons-material/AccountCircle';
import ThemeToggle from '../../components/ThemeToggle';
import WakeLockToggle from '../../components/WakeLockToggle';
import PrefetchLink from '../../components/PrefetchLink';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { ToastProvider } from '../../contexts/ToastContext';

export default function AdminLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Ensure store document exists for legacy accounts
  useEffect(() => {
    if (!user) return;

    const checkAndCreateStore = async () => {
      try {
        const storeRef = doc(db, 'stores', user.uid);
        const storeDoc = await getDoc(storeRef);

        if (!storeDoc.exists()) {
          console.log('Store document missing for legacy account. Creating now...');
          await setDoc(storeRef, {
            ownerId: user.uid,
            email: user.email,
            storeName: 'My Store', // Default name
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            // Initialize other necessary fields if needed
            paymentMethods: {
              cash: true,
              paypay: false,
            }
          }, { merge: true });
          console.log('Store document created successfully.');
        }
      } catch (error) {
        console.error('Error checking/creating store document:', error);
      }
    };

    checkAndCreateStore();
  }, [user]);

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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ToastProvider>
      <>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              マルシェ管理画面
            </Typography>
            <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
              <Button color="inherit" component={PrefetchLink} to="/admin/dashboard">
                ダッシュボード
              </Button>
              <Button color="inherit" component={PrefetchLink} to="/admin/menu">
                メニュー管理
              </Button>
              <Button color="inherit" component={PrefetchLink} to="/admin/analytics">
                売上分析
              </Button>
              <Button color="inherit" component={PrefetchLink} to="/admin/options">
                オプション管理
              </Button>
              <Button color="inherit" component={PrefetchLink} to="/admin/settings/payment">
                決済設定
              </Button>
              <Button color="inherit" component={PrefetchLink} to="/admin/settings/qrcode">
                QRコード設定
              </Button>
              <Button color="inherit" component={PrefetchLink} to="/admin/settings/social">
                SNS設定
              </Button>
              <Button
                color="inherit"
                component={Link}
                to={user?.uid ? `/menu/${user.uid}` : '#'}
                target="_blank"
                rel="noopener noreferrer"
                disabled={!user?.uid}
              >
                顧客画面を確認
              </Button>
            </Box>
            <Box sx={{ flexGrow: 0 }}>
              <WakeLockToggle />
              <ThemeToggle />
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
                <MenuItem disabled>
                  <Box>
                    <Typography variant="body2">{user?.email}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      ID: {user?.uid}
                    </Typography>
                  </Box>
                </MenuItem>
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
    </ToastProvider>
  );
}
