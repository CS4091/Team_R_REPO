import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  IconButton,
  TextField,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  Pagination,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import InventoryIcon from "@mui/icons-material/Inventory";
import { useModalStack } from "../../hooks/useModalStack";
import InventoryItemForm from "../forms/InventoryItemForm";
import axios from "axios";
import { useParams } from "react-router-dom";
import { useSnackbar } from "../../hooks/useSnackBar";

interface InventoryItem {
  id: number;
  name: string;
  description: string;
  quantity: number;
}

const InventoryPage: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [distributorName, setDistributorName] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // Default page size
  const { id } = useParams<{ id: string }>();
  const { pushModal, popModal } = useModalStack();
  const { setMessageSnack } = useSnackbar();

  // Fetch Inventory Items
  const fetchInventory = useCallback(async () => {
    try {
      const response = await axios.get(
        `/services/api/inventory-item/?distribution_center=${id}&search=${searchTerm}&page=${currentPage}&page_size=${pageSize}`
      );
      setInventory(response.data.results);
      setTotalItems(response.data.count);
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
    }
  }, [id, searchTerm, currentPage, pageSize]);

  // Fetch Distributor Name
  useEffect(() => {
    if (!id) return;

    const getName = async () => {
      try {
        const response = await axios.get(`/services/api/distribution-center/${id}`);
        setDistributorName(response.data.center_name);
      } catch (error) {
        console.error("Failed to fetch distributor name:", error);
        setDistributorName("Unknown Distributor");
      }
    };

    getName();
  }, [id]);

  // Handle Add Item
  const handleAddItem = useCallback(() => {
    if (!id) return;

    pushModal(
      "Add Inventory Item",
      <InventoryItemForm
        onSubmitSuccess={() => {
          popModal();
          fetchInventory();
        }}
        distributionId={parseInt(id)}
      />
    );
  }, [id, pushModal, popModal, fetchInventory]);

  // Handle Quantity Change
  const handleQuantityChange = useCallback((itemId: number, newQuantity: number) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  }, []);

  // Handle Save Quantity
  const handleSaveQuantity = useCallback(
    async (itemId: number, newQuantity: number) => {
      try {
        await axios.patch(`/services/api/inventory-item/${itemId}/`, {
          quantity: newQuantity,
        });
        fetchInventory(); // Refresh the inventory after saving
        setMessageSnack("Saved Quantity", "success");
      } catch (error) {
        setMessageSnack("Failed to save quantity", "error");
      }
    },
    [fetchInventory, setMessageSnack]
  );

  // Handle Page Size Change
  const handlePageSizeChange = useCallback((event: any) => {
    setPageSize(event.target.value as number);
    setCurrentPage(1); // Reset to the first page when page size changes
  }, []);

  // Effects
  useEffect(() => {
    fetchInventory();
  }, [fetchInventory, searchTerm, currentPage, pageSize]);

  return (
    <Box p={3}>
      {/* Title Section */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <InventoryIcon color="primary" fontSize="large" />
          <Typography variant="h4" component="h1">
            {distributorName ? `${distributorName}` : ""}
          </Typography>
        </Box>
        <IconButton color="primary" onClick={handleAddItem}>
          <AddIcon />
        </IconButton>
      </Box>

      {/* Search Bar */}
      <Box mb={3}>
        <TextField
          label="Search Inventory"
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Box>

      {/* Pagination Controls and Total Items */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <FormControl sx={{ minWidth: 100 }} variant="outlined">
            <InputLabel id="page-size-label">Items</InputLabel>
            <Select
              labelId="page-size-label"
              value={pageSize}
              onChange={handlePageSizeChange}
              label="Items per Page"
            >
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={25}>25</MenuItem>
              <MenuItem value={50}>50</MenuItem>
              <MenuItem value={100}>100</MenuItem>
            </Select>
          </FormControl>
          <Pagination
            count={Math.ceil(totalItems / pageSize)}
            page={currentPage}
            onChange={(_, page) => setCurrentPage(page)}
            color="primary"
          />
        </Box>
      </Box>
      <Typography>Total Items: {totalItems}</Typography>

      {/* Inventory List */}
      {inventory.length === 0 ? (
        <Typography color="textSecondary">
          {searchTerm ? "No items match your search." : "No inventory items available."}
        </Typography>
      ) : (
        <List>
          {inventory.map((item) => (
            <React.Fragment key={item.id}>
              <ListItem>
                <ListItemText
                  primary={item.name}
                  secondary={item.description}
                />
                <Box display="flex" alignItems="center" gap={1}>
                  <TextField
                    type="number"
                    variant="outlined"
                    size="small"
                    value={item.quantity}
                    onChange={(e) =>
                      handleQuantityChange(item.id, parseInt(e.target.value, 10) || 0)
                    }
                    inputProps={{
                      maxLength: 3,
                      min: 0,
                      max: 999,
                    }}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleSaveQuantity(item.id, item.quantity)}
                  >
                    Save
                  </Button>
                </Box>
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
      )}
    </Box>
  );
};

export default InventoryPage;
