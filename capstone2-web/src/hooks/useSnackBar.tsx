// SnackbarProvider.tsx
import { createContext, useContext, useState, ReactNode, FC, useCallback } from 'react';
import { Snackbar, Alert, CircularProgress, Box, useMediaQuery, useTheme } from '@mui/material';

type SnackbarStatus = 'success' | 'info' | 'warning' | 'error';

interface SnackbarContextType {
  setMessageSnack: (message: string, status: SnackbarStatus) => void;
  setLoadingSnack: (message: string | null) => void;
  closeSnack: () => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

export const useSnackbar = (): SnackbarContextType => {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
};

interface SnackbarProviderProps {
  children: ReactNode;
}

export const SnackbarProvider: FC<SnackbarProviderProps> = ({ children }) => {
  const [snackMessage, setSnackMessage] = useState<string | null>(null);
  const [snackStatus, setSnackStatus] = useState<SnackbarStatus | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('sm'));

  const setMessageSnack = useCallback((message: string, status: SnackbarStatus) => {
    setSnackMessage(message);
    setSnackStatus(status);
    setLoadingMessage(null);
  }, []);

  const setLoadingSnack = useCallback((message: string | null) => {
    setLoadingMessage(message);
    setSnackMessage(null)
    setSnackStatus(null)
  }, []);

  const handleMessageClose = useCallback(() => {
    setSnackMessage(null);
    setLoadingMessage(null);
    setSnackStatus(null);
  }, []);


  return (
    <SnackbarContext.Provider value={{ setMessageSnack, setLoadingSnack, closeSnack:handleMessageClose }}>
      {children}

      {/* Message Snackbar */}
      <Snackbar
        open={Boolean(snackMessage)}
        autoHideDuration={5000}
        onClose={handleMessageClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: isDesktop ? 'right' : 'center', // Bottom-right on desktop, center-bottom on mobilTayle
        }}
        style={{
          bottom: 40, // Adjusts position when loading snackbar is also open
          
        }}
      >
        <Alert severity={snackStatus || 'info'} variant="filled">
          {snackMessage}
        </Alert>
      </Snackbar>

      {/* Loading Snackbar */}
      <Snackbar
        open={Boolean(loadingMessage)}
        anchorOrigin={{ 
            vertical: 'bottom', 
            horizontal: isDesktop ? 'right' : 'center', // Bottom-right on desktop, center-bottom on mobile
        }}
        style={{
          bottom: 40,
        }}
      >
        <Box display="flex" alignItems="center" p={2} bgcolor="background.paper" borderRadius={1}>
          <CircularProgress size={24} style={{ marginRight: 16 }} />
          {loadingMessage}
        </Box>
      </Snackbar>
    </SnackbarContext.Provider>
  );
};
