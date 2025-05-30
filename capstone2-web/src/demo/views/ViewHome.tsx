import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Divider,
  IconButton,
  Tooltip,
  Grid,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import FlightIcon from "@mui/icons-material/Flight";
import PublicIcon from "@mui/icons-material/Public";

const HomePage: React.FC = () => {
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    fetch("/services/api/users/")
      .then((response) => response.json())
      .then((data) => {
        setUserCount(data.count || data.results?.length || 0);
      })
      .catch((error) => {
        console.error("Error fetching user count:", error);
      });
  }, []);

  const [flightCount, setFlightCount] = useState(0);

  useEffect(() => {
    fetch("/services/api/flightlog")
    .then((response) => response.json())
    .then((data) => {
      setFlightCount(data.count || data.results?.length || 0);
    })
    .catch((error) => {
      console.error("Error fetching flight count:", error);
    });
  }, []);

  const [distCount, setDistCount] = useState(0);

  useEffect(() => {
    fetch("/services/api/worlds/")
      .then((response) => response.json())
      .then((data) => {
        setDistCount(data.count || data.results?.length || 0);
      })
      .catch((error) => {
        console.error("Error fetching world count:", error);
      });
  }, []);
  
  const deliverers = 45;

  return (
    <Container>
      {/* Title and Description */}
      <Typography variant="h4" align="center" color="primary" gutterBottom sx={{ mt: 3 }}>
        Airplane Navigator
      </Typography>
      <Typography variant="h5" align="center" color="primary" gutterBottom>
        Capstone 2 Project
      </Typography>
      <Typography align="center" color="primary" paragraph>
        This application is for our senior project in Computer Science at
        Missouri S&T. The left side is a 2D grid that the user can control with
        a bot.
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} justifyContent="center" sx={{ px: 2 }}>
        {[{
          title: "Users connected to our network",
          value: `${userCount} User(s)`,
          icon: <PeopleIcon fontSize="large" color="primary" />
        }, {
          title: "Number of Simulated Airplanes",
          value: `${deliverers} Airplanes`,
          icon: <FlightIcon fontSize="large" color="primary" />
        }, {
          title: "Number of Worlds",
          value: `${distCount} World(s)`,
          icon: <PublicIcon fontSize="large" color="primary" />
        }].map((item, index) => (
          <Grid item xs={12} sm={4} key={index}>
            <Card
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
              }}
            >
              <CardContent>
                <Tooltip title={item.title}>
                  <IconButton>{item.icon}</IconButton>
                </Tooltip>
                <Typography variant="h5" align="center">
                  {item.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Horizontal Divider */}
      <Divider sx={{ my: 4 }} />
    </Container>
  );
};

export default HomePage;
