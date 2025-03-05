import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Button, TextField, IconButton, Card, CardContent, Box } from "@mui/material";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Pagination } from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";
import { useMapGrid } from "../../hooks/useMapGrid";

interface World {
  id: number;
  name: string;
  created_at: string;
  basemap: number[][][]
}

const WorldList: React.FC = () => {
  const [worlds, setWorlds] = useState<World[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { setMap } = useMapGrid();
  useEffect(() => {
    axios.get(`/services/api/worlds?page=${page}&search=${search}`)
      .then((res) => {
        setWorlds(res.data.results);
        setTotalPages(Math.ceil(res.data.count / 10));
      })
      .catch((err) => console.error(err));
  }, [page, search]);

  const handleDelete = useCallback((id: number) => {
    axios.delete(`/services/api/worlds/${id}/`)
      .then(() => setWorlds((prev) => prev.filter((world) => world.id !== id)))
      .catch((err) => console.error(err));
  }, []);

  const handleLoadMap = useCallback((world: World) => {
      setMap(world.basemap)
  }, []);

  const handleAddWorld = useCallback(() => {
    // Empty for now
  }, []);

  return (
    <>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <TextField
            label="Search by world name"
            variant="outlined"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
          />
          <Button variant="contained" onClick={handleAddWorld} sx={{ height: "56px" }}>+</Button>
        </Box>
        <Box display="flex" justifyContent="center" mt={2}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
          />
        </Box>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {worlds.map((world) => (
                <TableRow key={world.id}>
                  <TableCell>
                    <Button color="primary" onClick={() => handleLoadMap(world)}>
                      {world.name}
                    </Button>
                  </TableCell>
                  <TableCell>{new Date(world.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <IconButton color="error" onClick={() => handleDelete(world.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </>
  );
};

export default WorldList;