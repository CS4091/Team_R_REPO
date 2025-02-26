import React from 'react';
import { Box, List, ListItem, ListItemText, Drawer, ListItemButton, Divider, ListItemIcon } from '@mui/material';
import { useMediaQuery, useTheme } from '@mui/material';
import Toolbar from '@mui/material/Toolbar';

export interface SideMenuItem {
  label: string;
  icon?: React.ReactNode; 
  onClick?: () => void;  // Optional click handler for each item
}

export interface SideMenuProps {
  menuItems: SideMenuItem[][];  // Accept SideMenuItem as props
  drawerWidth?: number;   // Optional: allow setting a custom drawer width
  open: boolean;
}

const SideMenu: React.FC<SideMenuProps> = ({ menuItems, drawerWidth = 240, open }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Drawer
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          bgcolor: '#00273e', // Set the background color to dark blue
          color: 'white',      // Set the text color to white
        },
      }}
      variant={isMobile ? 'temporary' : 'permanent'}
      open={isMobile ? open : true}
      anchor="left"
    >
      <Toolbar />
      <Box sx={{ overflow: 'auto' }}>
        {menuItems.map((group, groupIndex) => (
          <React.Fragment key={groupIndex}>
            <List>
              {group.map((item, index) => (
                <ListItem key={index} disablePadding>
                  <ListItemButton
                    onClick={item.onClick}
                    sx={{
                      '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }, // Optional: lighter hover effect
                    }}
                  >
                    {/* Optional Icon */}
                    {item.icon && (
                      <ListItemIcon sx={{ color: 'white' }}>{item.icon}</ListItemIcon> // Set icon color to white
                    )}
                    <ListItemText primary={item.label} sx={{ color: 'white' }} /> {/* Set text color to white */}
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
            {/* Add a Divider after each group except the last */}
            {groupIndex < menuItems.length - 1 && <Divider sx={{ bgcolor: 'white' }} />} {/* Divider color */}
          </React.Fragment>
        ))}
      </Box>
    </Drawer>
  );
};

export default SideMenu;
