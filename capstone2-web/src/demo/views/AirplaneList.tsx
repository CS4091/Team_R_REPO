import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  TextField,
  Pagination,
  Tooltip,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
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
  color: string; // Add color property
  flight_ended?: boolean;
}

const AirplaneList: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [airplanes, setAirplanes] = useState<Airplane[]>([]);
  const [basemap, setBasemap] = useState<number[][][]>([]);
  const [page, setPage] = useState(1);
  const { setMap } = useMapGrid();
  const itemsPerPage = 5;
  const { setMessageSnack } = useSnackbar();

  const [token, setToken] = useState<string>("");

  useEffect(() => {
    axios
      .get(`/services/api/worldtoken/?world=${id}`)
      .then((res) => {
        console.log(res.data);
        setToken(res.data.world_token);
      })
      .catch((err) => {
        setMessageSnack("Failed to get token", "error");
      });
  }, [setToken, id]);

  useEffect(() => {
    axios
      .get(`/services/api/worlds/${id}`)
      .then((res) => {
        setMap(res.data.basemap);
        setBasemap(res.data.basemap);
        setMessageSnack("World loaded successfully", "success");
      })
      .catch((err) => console.error(err));
  }, [id]);

  // Function to get scanner coverage cells based on airplane position and orientation
  const getScannerCoverageCells = (
    x: number,
    y: number,
    rotation: string,
    mapWidth: number,
    mapHeight: number
  ) => {
    const coverageCells: [number, number][] = [];

    // Define offsets for the scanner coverage (2x3 rectangle ahead of aircraft)
    switch (rotation) {
      case "UP":
        // Scanning area is above the aircraft
        for (let i = -1; i <= 0; i++) {
          for (let j = -1; j <= 1; j++) {
            const newY = y - 1 - i; // One row above the aircraft and continue up
            const newX = x + j;
            if (newX >= 0 && newX < mapWidth && newY >= 0 && newY < mapHeight) {
              coverageCells.push([newX, newY]);
            }
          }
        }
        break;
      case "DOWN":
        // Scanning area is below the aircraft
        for (let i = -1; i <= 0; i++) {
          for (let j = -1; j <= 1; j++) {
            const newY = y + 1 + i; // One row below the aircraft and continue down
            const newX = x + j;
            if (newX >= 0 && newX < mapWidth && newY >= 0 && newY < mapHeight) {
              coverageCells.push([newX, newY]);
            }
          }
        }
        break;
      case "LEFT":
        // Scanning area is to the left of the aircraft
        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 0; j++) {
            const newY = y + i;
            const newX = x - 1 - j; // One column to the left and continue left
            if (newX >= 0 && newX < mapWidth && newY >= 0 && newY < mapHeight) {
              coverageCells.push([newX, newY]);
            }
          }
        }
        break;
      case "RIGHT":
        // Scanning area is to the right of the aircraft
        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 0; j++) {
            const newY = y + i;
            const newX = x + 1 + j; // One column to the right and continue right
            if (newX >= 0 && newX < mapWidth && newY >= 0 && newY < mapHeight) {
              coverageCells.push([newX, newY]);
            }
          }
        }
        break;
    }

    return coverageCells;
  };

  useEffect(() => {
    const fetchAirplanes = async () => {
      // check basemap
      if (basemap.length === 0) {
        return;
      }
      try {
        const response = await fetch(`/services/api/airplanes?world=${id}`);
        const data = await response.json();

        const scannedCellsCall = await axios.get(
          `/services/api/scanned-cell/?world=${id}&page_size=10000`
        );

        // deep copy the basemap
        let newBasemap = JSON.parse(JSON.stringify(basemap));

        // Map dimensions
        const mapHeight = basemap.length;
        const mapWidth = basemap[0].length;

        // First lets draw the scanned cells. We want a light yellow color for scanned cells
        scannedCellsCall.data.results.forEach((scannedCell: any) => {
          let color = [0, 0, 0];
          // if the scanned cell is from the base map [255, 255, 255], then we will mark it as grey
          if (
            basemap[scannedCell.pos_y][scannedCell.pos_x][0] === 255 &&
            basemap[scannedCell.pos_y][scannedCell.pos_x][1] === 255 &&
            basemap[scannedCell.pos_y][scannedCell.pos_x][2] === 255
          ) {
            newBasemap[scannedCell.pos_y][scannedCell.pos_x] = [255, 255, 0];
          } else {
            newBasemap[scannedCell.pos_y][scannedCell.pos_x] = [255, 0, 0];
          }
        });

        data.results.forEach((airplane: Airplane) => {
          // check if airplane is out of bounds
          if (
            airplane.pos_x < 0 ||
            airplane.pos_x >= mapWidth ||
            airplane.pos_y < 0 ||
            airplane.pos_y >= mapHeight
          ) {
            setMessageSnack(
              `Airplane ${airplane.name} is out of bounds and will be deleted`,
              "warning"
            );
            return;
          }

          // Use airplane color from backend
          const planeColor = [
            parseInt(airplane.color.slice(1, 3), 16),
            parseInt(airplane.color.slice(3, 5), 16),
            parseInt(airplane.color.slice(5, 7), 16),
          ];

          // Visualize orientation with a slight color variation in the direction of travel
          const directionColor = [
            Math.min(255, planeColor[0] * 1.2), // Slightly brighter color
            Math.min(255, planeColor[1] * 1.2),
            Math.min(255, planeColor[2] * 1.2),
          ];

          // Radar/scanner color: complementary color of planeColor
          const scannerColor = [
            255 - planeColor[0],
            255 - planeColor[1],
            255 - planeColor[2],
          ];

          // Add orientation indicator (a colored cell in front of the airplane)
          let orientationX = airplane.pos_x;
          let orientationY = airplane.pos_y;

          switch (airplane.rotation) {
            case "UP":
              orientationY = Math.max(0, airplane.pos_y - 1);
              break;
            case "DOWN":
              orientationY = Math.min(mapHeight - 1, airplane.pos_y + 1);
              break;
            case "LEFT":
              orientationX = Math.max(0, airplane.pos_x - 1);
              break;
            case "RIGHT":
              orientationX = Math.min(mapWidth - 1, airplane.pos_x + 1);
              break;
          }

          // Only set the orientation indicator if it's not the same as the airplane position
          if (
            orientationX !== airplane.pos_x ||
            orientationY !== airplane.pos_y
          ) {
            newBasemap[orientationY][orientationX] = directionColor;
          }

          // Get and set scanner coverage cells
          const scannerCells = getScannerCoverageCells(
            airplane.pos_x,
            airplane.pos_y,
            airplane.rotation,
            mapWidth,
            mapHeight
          );

          // Apply scanner coverage colors
          scannerCells.forEach(([x, y]) => {
            newBasemap[y][x] = scannerColor;
          });
          // Set airplane position with its unique color
          newBasemap[airplane.pos_y][airplane.pos_x] = planeColor;
        });

        setMap(newBasemap);
        setAirplanes(data.results);
      } catch (error) {
        console.error("Failed to fetch airplanes:", error);
      }
    };

    const interval = setInterval(fetchAirplanes, 250); // Refresh every 250ms
    return () => clearInterval(interval);
  }, [id, basemap]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(token);
  }, [token]);

  const handleDelete = (id: number) => {
    axios
      .delete(`/services/api/airplanes/${id}/`)
      .then(() => setMessageSnack("Airplane deleted successfully", "success"))
      .catch((err) => console.error(err));
  };

  const handleEndFlight = async (id: number) => {
    try {
      await axios.post(`/services/api/airplanes/${id}/end_flight/`);
      setMessageSnack("Flight marked as done.", "success");
    } catch (err) {
      setMessageSnack("Failed to mark flight as done.", "error");
    }
  };

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setPage(value);
  };

  const paginatedAirplanes = airplanes.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

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
            <ListItemText
              primary={plane.name}
              secondary={
                <>
                  Updated: {new Date(plane.updated_at).toLocaleString()} <br />
                  Position: ({plane.pos_x}, {plane.pos_y}) | Facing:{" "}
                  {plane.rotation}
                  {plane.flight_ended && (
                    <span style={{ color: "green", marginLeft: 8 }}>
                      (Flight Ended)
                    </span>
                  )}
                </>
              }
            />
            <ListItemSecondaryAction>
              {!plane.flight_ended && (
                <Tooltip title="Mark flight as done">
                  <IconButton
                    edge="end"
                    onClick={() => handleEndFlight(plane.id)}
                  >
                    <CheckCircleIcon color="primary" />
                  </IconButton>
                </Tooltip>
              )}
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
