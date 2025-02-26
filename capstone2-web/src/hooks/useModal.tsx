import React, { useState } from "react";
import { Modal as MUIModal, Box, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

interface UseModalReturn {
  Modal: React.FC<{ children: React.ReactNode }>;
  openModal: () => void;
  closeModal: () => void;
}

interface ModalParams {
  xs?: string
  sm?: string
  md?: string
}

export const useModal = ({ xs="80vw", sm="60vw", md="600px" }: ModalParams = {xs:"80vw", sm:"60vw", md:"600px"}): UseModalReturn => {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  // Responsive styling for the modal box
  const styles = {
    modalBox: {
      position: "relative" as "relative",
      width: { xs, sm, md }, // Responsive width
      maxWidth: "100%", // Ensure it never exceeds viewport width
      bgcolor: "background.paper",
      borderRadius: "8px",
      boxShadow: 24,
      p: 3,
      outline: "none",
      mx: "auto", // Center horizontally
      my: "10vh", // Center vertically with spacing from the top
      display: "flex",
      flexDirection: "column",
    },
    closeButton: {
      position: "absolute" as "absolute",
      top: 8,
      right: 8,
    },
  };

  const Modal: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <MUIModal open={isOpen} onClose={closeModal}>
      <Box sx={styles.modalBox}>
        <IconButton
          aria-label="close"
          onClick={closeModal}
          sx={styles.closeButton}
        >
          <CloseIcon />
        </IconButton>
        {children}
      </Box>
    </MUIModal>
  );

  return { Modal, openModal, closeModal };
};
