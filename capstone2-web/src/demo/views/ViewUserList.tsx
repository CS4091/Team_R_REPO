import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Button, CardContent, Box } from "@mui/material";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Pagination } from "@mui/material";
import { useNavigate } from "react-router-dom";
interface user {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

const UserList: React.FC = () => {
  const [users, setusers] = useState<user[]>([]);
  const [search] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();
  useEffect(() => {
    axios.get(`/services/api/users?page=${page}&search=${search}`)
      .then((res) => {
        setusers(res.data.results);
        setTotalPages(Math.ceil(res.data.count / 10));
      })
      .catch((err) => console.error(err));
  }, [page, search]);

  const handleLoadMap = useCallback((user: user) => {
    navigate(`/users/${user.id}`);
  }, [ useNavigate ]);


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
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Button color="primary" onClick={() => handleLoadMap(user)}>
                      {user.first_name} {user.last_name}
                    </Button>
                  </TableCell>
                  <TableCell>{new String(user.email)}</TableCell>
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