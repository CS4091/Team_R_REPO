import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
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
import InventoryIcon from "@mui/icons-material/Inventory";
import { useSnackbar } from "../../hooks/useSnackBar";
import axios from "axios";

interface InventoryItem {
  id: number;
  name: string;
  description: string;
  quantity: number;
}

const CollectorInventoryPage: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { setMessageSnack } = useSnackbar();

  // Fetch Inventory Items
  const fetchInventory = useCallback(async () => {
    try {
      const response = await axios.get(
        `/services/api/inventory-item/?&search=${searchTerm}&page=${currentPage}&page_size=${pageSize}`
      );
      setInventory(response.data.results);
      setTotalItems(response.data.count);
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
    }
  }, [searchTerm, currentPage, pageSize]);

  // Handle Request Item
  const handleRequestItem = useCallback(
    async (itemId: number) => {
      try {
        await axios.post(`/services/api/requests/`, {
          item_id: itemId,
        });
        setMessageSnack("Item requested successfully", "success");
      } catch (error) {
        console.error("Failed to request item:", error);
        setMessageSnack("Failed to request item", "error");
      }
    },
    [setMessageSnack]
  );

  // Handle Page Size Change
  const handlePageSizeChange = useCallback((event: any) => {
    setPageSize(event.target.value as number);
    setCurrentPage(1);
  }, []);

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
            Available Inventory
          </Typography>
        </Box>
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
                  <Typography>{item.quantity}</Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleRequestItem(item.id)}
                  >
                    Request
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

export default CollectorInventoryPage;
