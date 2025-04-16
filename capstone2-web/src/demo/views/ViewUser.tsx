import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Button, CardContent, Box } from "@mui/material";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Pagination } from "@mui/material";
import { useNavigate } from "react-router-dom";
interface flightLog {
  id: number;
  airplane_name: string;
  coverage: string;
  world: string;
}

const UserList: React.FC = () => {
  const [flightLogs, setFlightLogs] = useState<flightLog[]>([]);
  const [search] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  useEffect(() => {
    axios.get(`/services/api/flightlog?page=${page}&search=${search}`)
      .then((res) => {
        setFlightLogs(res.data.results);
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
                <TableCell>AirplaneName</TableCell>
                <TableCell>Coverage %</TableCell>
                <TableCell>World</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {flightLogs.map((flightLog) => (
                <TableRow key={flightLog.id}>
                  <TableCell>{new String(flightLog.airplane_name)}</TableCell>
                  <TableCell>{new String(flightLog.coverage)}</TableCell>
                  <TableCell>{new String(flightLog.world)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </>
  );
};

export default UserList;