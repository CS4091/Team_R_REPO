import React, { useState } from "react";
// Remove swr imports since we're not using them
import {
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  Grid,
  Paper,
} from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import { useAuth0 } from "../../hooks/useAuth0";

interface WorldFormData {
  name: string;
  description: string;
  width: number;
  height: number;
}

export default function CreateWorldForm(): React.ReactElement {
  const { me } = useAuth0();
  const [formData, setFormData] = useState<WorldFormData>({
    name: "",
    description: "",
    width: 100,
    height: 100,
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "width" || name === "height" ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!me?.token) {
        throw new Error("You must be logged in to create a world");
      }

      const response = await fetch("/services/api/worlds/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${me.token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || "Failed to create world");
      }

      setFormData({
        name: "",
        description: "",
        width: 100,
        height: 100,
      });

      // navigate to the worlds page so it can load fresh data
      window.location.href = "/worlds";
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!me) {
    return <Alert severity="warning">Please log in to create a world</Alert>;
  }

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 600, mx: "auto" }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Create New World
      </Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              label="World Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              required
              type="number"
              label="Width"
              name="width"
              value={formData.width}
              onChange={handleChange}
              variant="outlined"
              inputProps={{ min: 1 }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              required
              type="number"
              label="Height"
              name="height"
              value={formData.height}
              onChange={handleChange}
              variant="outlined"
              inputProps={{ min: 1 }}
            />
          </Grid>
          {error && (
            <Grid item xs={12}>
              <Alert severity="error">{error}</Alert>
            </Grid>
          )}
          <Grid item xs={12}>
            <Button
              fullWidth
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              sx={{ py: 1.5 }}
            >
              {loading ? (
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                  Creating World...
                </Box>
              ) : (
                "Create World"
              )}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
}
