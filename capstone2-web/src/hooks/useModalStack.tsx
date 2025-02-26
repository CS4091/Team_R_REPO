import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Box, Typography, Modal } from '@mui/material';

type ModalElement = {
  layerName: string;
  element: ReactNode;
  onPop?: () => void;
};

type ModalStackContextType = {
  pushModal: (layerName: string, element: ReactNode, onPop?: () => void) => void;
  popModal: () => void;
  clearModal: () => void;
};

const ModalStackContext = createContext<ModalStackContextType | undefined>(undefined);

type ModalStackProviderProps = {
  children: ReactNode;
};

export const ModalStackProvider: React.FC<ModalStackProviderProps> = ({ children }) => {
  const [modals, setModals] = useState<ModalElement[]>([]);

  const pushModal = useCallback((layerName: string, element: ReactNode, onPop?: () => void) => {
    setModals((prev) => [...prev, { layerName, element, onPop }]);
  }, []);

  const popModal = useCallback(() => {
    setModals((prev) => {
      if (prev.length === 0) return prev;
      const popped = prev[prev.length - 1];
      const remaining = prev.slice(0, -1);
      if (popped.onPop) {
        popped.onPop();
      }
      return remaining;
    });
  }, []);

  const clearModal = useCallback(() => {
    setModals((prev) => {
      // Call handleState with the current state before clearing

      // Run onPop on all remaining modals
      prev.forEach((modal) => {
        if (modal.onPop) {
          modal.onPop();  // Nullify state for each modal
        }
      });
      return []; // Clear all modals from the stack
    });
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      popModal();
    }
  }, [popModal]);

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <ModalStackContext.Provider value={{ pushModal, popModal, clearModal }}>
      {children}
      {modals.length > 0 && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1300,
          }}
        >
          {/* Modal Content */}
          <Modal 
            open={true} onClose={popModal}   
            disablePortal
            disableEnforceFocus // Prevents the modal from trapping focus
            disableScrollLock // Ensures scrolling works on mobile
            >
            <Box
              sx={{
                bgcolor: 'background.paper',
                p: 1,
                borderRadius: 1,
                boxShadow: 24,
                maxWidth: 500,
                mt: '10%',
                mx: { xs: 3, sm: 4, md: 'auto' }, // Extra padding for small screens
                position: 'relative',
              }}
            >
              {/* Vertical Layer Stack with Separator */}
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ borderLeft: '2px solid black', pl: 1 }}>
                  {modals.map((modal, index) => (
                    modal.layerName && (
                      <Typography key={index} variant="body2" sx={{ color: 'black', fontSize: '0.875rem', mb: 0.5 }}>
                        {modal.layerName}
                      </Typography>
                    )
                  ))}
                </Box>
              </Box>
              {modals[modals.length - 1].element}
            </Box>
          </Modal>
        </Box>
      )}
    </ModalStackContext.Provider>
  );
};

export const useModalStack = (): ModalStackContextType => {
  const context = useContext(ModalStackContext);
  if (!context) {
    throw new Error('useModalStack must be used within a ModalStackProvider');
  }
  return context;
};
