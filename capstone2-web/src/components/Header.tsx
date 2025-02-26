import React, { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { useMediaQuery, useTheme } from '@mui/material';

interface HeaderProps {
  appName: string;
  isLoggedIn: boolean;
  userName?: string;
  userAvatarUrl?: string;
  icon?: string; // Icon image URL or component
  iconLink?: string; // Link for the icon
  onMenuClick: () => void;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  profileClick: () => void;
}

const Header: React.FC<HeaderProps> = ({
  appName,
  isLoggedIn,
  userName,
  userAvatarUrl,
  icon,
  iconLink,
  onMenuClick,
  onLoginClick,
  onLogoutClick,
  profileClick,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfileClick = () => {
    setAnchorEl(null);
    profileClick();
  };

  const handleLogout = () => {
    handleMenuClose();
    onLogoutClick();
  };

  const handleIconClick = () => {
    if (iconLink) {
      window.location.href = iconLink;
    }
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar sx={{ height: '40px' }}>
        {/* Left: Hamburger Menu */}
        {isMobile && (
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={onMenuClick}
          >
            <MenuIcon />
          </IconButton>
        )}
        {/* Left of App Name: Icon */}
        {icon && (
          <IconButton onClick={handleIconClick} sx={{  }}>
            <img src={icon} alt="Icon" style={{ height: 50 }} />
          </IconButton>
        )}

        {/* Center: Application Name */}
        <Typography variant="h6" sx={{ flexGrow: 1, textAlign: isMobile ? 'center' : 'left', fontSize: '1rem' }}>
          {appName}
        </Typography>


        {/* Right: Login or User Info */}
        {isLoggedIn ? (
          <Box display="flex" alignItems="center">
            
            <IconButton onClick={handleMenuOpen} size="small">
              <Avatar alt={userName} src={userAvatarUrl} sx={{ width: 30, height: 30 }} />
            </IconButton>

            {/* Dropdown Menu */}
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem onClick={handleProfileClick}>Profile</MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
            <Typography variant="body1" sx={{ marginRight: 2 }}>
              {userName}
            </Typography>
          </Box>
        ) : (
          <Button color="inherit" onClick={onLoginClick}>
            Login
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
