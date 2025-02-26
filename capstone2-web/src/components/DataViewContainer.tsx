// src/components/DataViewContainer.tsx
import React from 'react';
import { Box } from '@mui/material';

interface DataViewContainerProps {
  controlPanel: React.ReactNode;  // Custom content for the DataControl panel
  viewPanel: React.ReactNode;     // Custom content for the DataView panel
}

const DataViewContainer: React.FC<DataViewContainerProps> = ({ controlPanel, viewPanel }) => {
  return (
    
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '2fr 3fr' }, // 1 column on small screens, 2:3 ratio on larger screens
          gridTemplateRows: { xs: '2fr 3fr', md: '1fr' }, // Stacks rows on mobile, one row on desktop
          height: '100%', // Full viewport height
          width: '100%',
        }}
      >
        {/* DataView Panel - Set to display first on mobile */}
        <Box
          sx={{
            order: { xs: 1, md: 2 },  // Show the DataView first in mobile view (xs), second in desktop view (md)
            backgroundColor: 'background.default',
          }}
        >
          <div style={{width:'100%'}}></div>
          {viewPanel}
        </Box>

        {/* DataControl Panel */}
        <Box
          sx={{
            order: { xs: 2, md: 1 },  // Show the DataControl second in mobile view (xs), first in desktop view (md)
            backgroundColor: 'background.paper',
            borderRight: { md: '1px solid rgba(0, 0, 0, 0.12)' },  // Adds a right border on desktop
            overflowY: 'auto', // Scroll if content overflows
          }}
        >
          {controlPanel}
        </Box>
      </Box>
   
  );
};

export default DataViewContainer;
