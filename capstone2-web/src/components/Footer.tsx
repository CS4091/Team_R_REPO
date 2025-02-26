import React from 'react';

import { Box, Typography, Link } from '@mui/material';

interface FooterItem {
  label: string;
  action?: () => void;  // Optional action when the item is clicked
  href?: string;        // Optional external/internal link
}

interface FooterProps {
  items: FooterItem[];  // Array of footer items
}

const Footer: React.FC<FooterProps> = ({ items }) => {
  return (
    <Box
      component="footer"
      sx={{
        justifyContent: 'space-between',
        padding: '5px 20px',
        backgroundColor: 'primary.main',
        color: 'white',
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100vw',
        height: '25px',
        zIndex: (theme) => theme.zIndex.drawer + 1 
      }}
    >
      <Box>
        {items.map((item, index) => (
          item.href ? (
            // If href is provided, render a clickable link
            <Link
              key={index}
              href={item.href}
              variant="body2"
              target="_blank"  // Opens in a new tab
              rel="noopener noreferrer"  // Prevents security vulnerabilities
              sx={{ color: 'inherit', marginRight: index < items.length - 1 ? 2 : 0 }}
            >
              {item.label}
            </Link>
          ) : item.action ? (
            // If action is provided but no href, render a clickable button
            <Link
              key={index}
              component="button"
              variant="body2"
              onClick={item.action}
              sx={{ color: 'inherit', marginRight: index < items.length - 1 ? 2 : 0 }}
            >
              {item.label}
            </Link>
          ) : (
            // If no action or href, render as static text
            <Typography
              key={index}
              variant="body2"
              sx={{ display: 'inline', marginRight: index < items.length - 1 ? 2 : 0 }}
            >
              {item.label}
            </Typography>
          )
        ))}
      </Box>
    </Box>
  );
};

export default Footer;
