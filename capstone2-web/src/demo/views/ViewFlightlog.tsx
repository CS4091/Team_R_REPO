import React, { useState, useEffect} from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { CardContent, Box } from "@mui/material";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Pagination } from "@mui/material";
/*
interface flightlog {
  id: string;
  name: string;
  coverage: string;
  world: string;
}
*/
interface userdata{
  id: string;
  first_name: string;
  last_name: string;

}
const tempVar: userdata= {
  id : "",
  first_name : "",
  last_name : "",
}

const arrUser: userdata[] =[];


const FlightlogList: React.FC = () => {
  const { id } = useParams();
  const [search] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [ userDatalist, setuserdata ] = useState ();
  useEffect(() => {
    // Grab Usr Data here /services/api/user/{id}
    axios.get(`/services/api/users/${id}`)
    .then((res) => {

      tempVar.id = res.data.id;
      tempVar.first_name = res.data.first_name;
      tempVar.last_name = res.data.last_name;
      arrUser.push(tempVar);

      setuserdata(res.data.results);
      setTotalPages(Math.ceil(res.data.count / 10));
      console.log(res.data);
    })
    .catch((err) => console.error(err));
  }, [page, search])

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
                <TableCell>Coverage</TableCell>
                <TableCell>World</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {arrUser.map((data) => (
                <TableRow key={data.id}>
                  <TableCell>{data.first_name}</TableCell>
                  <TableCell>{new String(data.last_name)}</TableCell>
                  <TableCell>{new String(data.first_name)}</TableCell>
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