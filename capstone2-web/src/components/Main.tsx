import React from "react"
import { Box } from "@mui/material"
const Main = ({ children } : { children: React.ReactNode }) => {
    return (
        <Box component='main' sx={{ 
            height: 'calc(100vh - 80px)',
            position: 'relative',
            top: '60px',
            flexGrow: 1,
        }}>
            { children }
        </Box>
    )
}

export default Main