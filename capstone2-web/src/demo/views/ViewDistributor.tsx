import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom"; // Import Link from react-router-dom
import {
  Box,
  Typography,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  Button,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DistributorRegistrationForm from "../forms/RegisterDistributorForm";
import { useModalStack } from "../../hooks/useModalStack";
import axios from "axios";
import { useAuth0 } from "../../hooks/useAuth0";

interface Distributor {
  id: number;
  name: string;
  location: string;
}

const MyDistributionCenters: React.FC = () => {
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [previousPage, setPreviousPage] = useState<string | null>(null);
  const { me } = useAuth0()
  const { pushModal, popModal } = useModalStack();

  // Function to fetch data
  const fetchDistributors = useCallback(async (url: string) => {
    try {
      const response = await axios.get(url);
      const data = response.data;

      const parsedDistributors = data.results.map((item: any) => ({
        id: item.id,
        name: item.center_name,
        location: item.address,
      }));

      setDistributors(parsedDistributors);
      setNextPage(data.next);
      setPreviousPage(data.previous);
    } catch (error) {
      console.error("Failed to fetch distributors:", error);
    }
  }, []);

  // Fetch initial data
  useEffect(() => {
    fetchDistributors(`/services/api/distribution-center/?user=${me?.sub}`);
  }, [fetchDistributors]);

  // Handle adding a distributor
  const handleAddDistributor = useCallback(() => {
    pushModal(
      "Register Distributor",
      <DistributorRegistrationForm
        onSubmit={() => {
          popModal();
          fetchDistributors(`/services/api/distribution-center/?user=${me?.sub}`); // Refresh data after adding
        }}
      />
    );
  }, [pushModal, popModal, fetchDistributors]);

  // Pagination handlers
  const handleNext = useCallback(() => {
    if (nextPage) {
      fetchDistributors(nextPage);
    }
  }, [nextPage, fetchDistributors]);

  const handlePrevious = useCallback(() => {
    if (previousPage) {
      fetchDistributors(previousPage);
    }
  }, [previousPage, fetchDistributors]);

  return (
    <Box p={3}>
      {/* Title Section */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" component="h1">
          My Distribution Centers
        </Typography>
        <IconButton color="primary" onClick={handleAddDistributor}>
          <AddIcon />
        </IconButton>
      </Box>

      {/* Horizontal Separator */}
      <Divider sx={{ my: 2 }} />

      {/* Distributor List Section */}
      <Box>
        {distributors.length === 0 ? (
          <Typography variant="body1" color="textSecondary">
            No distributors added yet.
          </Typography>
        ) : (
          <>
            <List>
              {distributors.map((distributor) => (
                <ListItem key={distributor.id}>
                  <ListItemText
                    primary={
                      <Typography
                        component={Link}
                        to={`/distributor/${distributor.id}`}
                        variant="h6" // Makes the text slightly larger
                        color="primary" // Use primary theme color to highlight
                        style={{
                          textDecoration: "underline", // Ensures underline for visibility
                          fontWeight: "bold", // Makes the text stand out
                        }}
                      >
                        {distributor.name}
                      </Typography>
                    }
                    secondary={distributor.location}
                  />
                </ListItem>
              ))}
            </List>

            {/* Pagination Controls */}
            <Box display="flex" justifyContent="space-between" mt={2}>
              {previousPage && (
                <Button variant="contained" onClick={handlePrevious}>
                  Previous
                </Button>
              )}
              {nextPage && (
                <Button variant="contained" onClick={handleNext}>
                  Next
                </Button>
              )}
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

export default MyDistributionCenters;
