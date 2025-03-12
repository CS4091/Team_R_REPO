import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { IconButton, List, ListItem, ListItemText, ListItemSecondaryAction, TextField, Pagination, Tooltip } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import { useMapGrid } from "../../hooks/useMapGrid";
import { useSnackbar } from "../../hooks/useSnackBar";
interface Airplane {
  id: number;
  name: string;
  updated_at: string;
  pos_x: number;
  pos_y: number;
  rotation: "UP" | "DOWN" | "LEFT" | "RIGHT";
}

const AirplaneList: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [airplanes, setAirplanes] = useState<Airplane[]>([]);
  const [ basemap, setBasemap ] = useState<number[][][]>([]);
  const [page, setPage] = useState(1);
  const { setMap } = useMapGrid();
  const itemsPerPage = 5;
  const { setMessageSnack } = useSnackbar();

  const [ token, setToken ] = useState<string>("");

  useEffect(() => { 
    axios.get(`/services/api/worldtoken/?world=${id}`)
      .then((res) => {
        console.log(res.data)
        setToken(res.data.world_token)
      }).catch((err) => {
        setMessageSnack("Failed to get token", "error")
      })
  }, [ setToken, id ])



  useEffect(() => {
    axios.get(`/services/api/worlds/${id}`)
      .then((res) => {
        setMap(res.data.basemap)
        setBasemap(res.data.basemap)
        setMessageSnack("World loaded successfully", "success")
      })
      .catch((err) => console.error(err));
  }, [ id ])

  useEffect(() => {
    const fetchAirplanes = async () => {
      // check basemap
      if (basemap.length === 0) {
        return
      }
      try {
        const response = await fetch(`/services/api/airplanes?world=${id}`);
        const data = await response.json();
        
        // deep copy the basemap
        let newBasemap = JSON.parse(JSON.stringify(basemap))

        data.results.forEach((airplane: Airplane) => {
          // check if airplane is out of bounds
          if (airplane.pos_x < 0 || airplane.pos_x >= basemap[0].length || airplane.pos_y < 0 || airplane.pos_y >= basemap.length) {
            setMessageSnack(`Airplane ${airplane.name} is out of bounds and will be deleted`, "warning")
          }
          
          
          
          // regenerate random color for plane in [ r, g, b ]
          const color = [ Math.random() * 255, Math.random() * 255, Math.random() * 255 ]
          newBasemap[airplane.pos_y][airplane.pos_x] = color

        })
        setMap(newBasemap)
        setAirplanes(data.results);


      } catch (error) {
        console.error("Failed to fetch airplanes:", error);
      }
    };

    const interval = setInterval(fetchAirplanes, 250); // Refresh every 5 seconds
    return () => clearInterval(interval);
  
  }, [id, basemap]);
  

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(token);
  }, [token]);

  const handleDelete = (id: number) => {
    axios.delete(`/services/api/airplanes/${id}/`)
      .then(() => setMessageSnack("Airplane deleted successfully", "success"))
      .catch((err) => console.error(err));
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const paginatedAirplanes = airplanes.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 16 }}>
      {/* Access Token Field */}
      <TextField
        label="Access Token"
        value={token}
        variant="outlined"
        fullWidth
        InputProps={{
          readOnly: true,
          endAdornment: (
            <Tooltip title="Copy to clipboard">
              <IconButton onClick={handleCopy}>
                <ContentCopyIcon />
              </IconButton>
            </Tooltip>
          ),
        }}
        style={{ marginBottom: 16 }}
      />
      {/* Pagination */}
      <Pagination
        count={Math.ceil(airplanes.length / itemsPerPage)}
        page={page}
        onChange={handlePageChange}
        style={{ display: "flex", justifyContent: "center", marginTop: 16 }}
      />
      {/* Airplane List */}
      <List>
        {paginatedAirplanes.map((plane) => (
          <ListItem key={plane.id} divider>
            <ListItemText primary={plane.name} secondary={`Updated at: ${new Date(plane.updated_at).toLocaleString()}`} />
            <ListItemSecondaryAction>
              <Tooltip title="Delete">
                <IconButton edge="end" onClick={() => handleDelete(plane.id)}>
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    </div>
  );
};

export default AirplaneList;
