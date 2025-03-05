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
  Box,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import LocalFloristIcon from "@mui/icons-material/LocalFlorist";

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

  const deliverers = 45;
  const distributors = 30;

  return (
    <Container>
      {/* Title and Description */}
      <Typography variant="h4" align="center" gutterBottom sx={{ mt: 3 }}>
        Airplane Navigator
      </Typography>
      <Typography variant="h5" align="center" gutterBottom>
        Capstone 2 Project
      </Typography>
      <Typography align="center" paragraph>
        This application is for our senior project in Computer Science at
        Missouri S&T. The left side is a 2D grid that the user can control with
        a bot.
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} justifyContent="center" sx={{ px: 2 }}>
        {[
          {
            title: "Users connected to our network",
            value: `${userCount} Users`,
            icon: <PeopleIcon fontSize="large" color="primary" />,
          },
          {
            title: "Number of Simulated Airplanes",
            value: `${deliverers} Airplanes`,
            icon: <DirectionsCarIcon fontSize="large" color="primary" />,
          },
          {
            title: "Number of Worlds",
            value: `${distributors} Worlds`,
            icon: <LocalFloristIcon fontSize="large" color="primary" />,
          },
        ].map((item, index) => (
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
