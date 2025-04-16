import React, { useState, useEffect} from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { CardContent, Box } from "@mui/material";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Pagination } from "@mui/material";

interface flightlog {
  id: number;
  name: string;
  coverage: string;
  world: string;
}

const FlightlogList: React.FC = () => {
  const { id } = useParams()
  const [flightlogs, setflightlogs] = useState<flightlog[]>([]);
  const [search] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [ userData, setUserData ] = useState(null)
  useEffect(() => {
    // Grab Usr Data here /services/api/user/{id}
  }, [])

  useEffect(() => {
    axios.get(`/services/api/flightlogs?page=${page}&search=${search}`)
      .then((res) => {
        setflightlogs(res.data.results);
        setTotalPages(Math.ceil(res.data.count / 10));
      })
      .catch((err) => console.error(err));
  }, [page, search]);

  return (
    <>
      <CardContent>
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
                <TableCell>Email</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {flightlogs.map((flightlog) => (
                <TableRow key={flightlog.id}>
                  <TableCell>{flightlog.name}</TableCell>
                  <TableCell>{new String(flightlog.coverage)}</TableCell>
                  <TableCell>{new String(flightlog.world)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </>
  );
};

export default FlightlogList;