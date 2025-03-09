import { useState, useMemo, useEffect } from 'react'
import { Box } from "@mui/material"
import Footer from "../components/Footer"
import Main from '../components/Main'
import './App.css'
import { MapViewProvider } from './MapViewProvider'
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useSnackbar } from '../hooks/useSnackBar'
import { Outlet, useNavigate } from 'react-router-dom';
import Header from "../components/Header"
import SideMenu from '../components/SideMenu'
import { useAuth0 } from '../hooks/useAuth0'
import { useModalStack } from '../hooks/useModalStack'
import HomeIcon from "@mui/icons-material/Home";
import InfoIcon from "@mui/icons-material/Info";
import PhoneIcon from "@mui/icons-material/Phone";
import { MapGridProvider } from '../hooks/useMapGrid'
import PublicIcon from "@mui/icons-material/Public";

const FooterItems = [
  { label: 'Kevin Lai', href: "http://lai.git-pages.mst.edu/lai" },
  { label: 'Samarth Sinha' },
  { label: 'Dominick Dickerson' },
  { label: 'Kshitij Sharma' },
  { label: 'Noah Schaben' },
  { label: 'Samual Pauley' },

]


const theme = createTheme({
  palette: {
    primary: {
      main: '#003453', // Custom primary color
    },
    text: {
      primary: '#000000',
    },
  },

});


function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate();
  const [rolePages, setRolePages] = useState<any[]>([])

  const { pushModal, popModal } = useModalStack()

  const { setMessageSnack, setLoadingSnack, closeSnack } = useSnackbar()
  const { login, logout, me } = useAuth0();

  const [reload, setReload] = useState(false)


  const menuItems = useMemo(() => {
    const headers = [
      { label: 'Home', onClick: () => { navigate("/"); setMenuOpen(false); }, icon: <HomeIcon /> },
      { label: 'About', onClick: () => { navigate("/about"); setMenuOpen(false) }, icon: <InfoIcon /> },
      { label: 'Contact', onClick: () => { navigate("/contact"); setMenuOpen(false) }, icon: <PhoneIcon /> },
    ]

    return [
      headers,
      rolePages,
    ]
  }, [rolePages])

  useEffect(() => {
    if (!me) return 
    setRolePages([
      { label: 'Worlds', onClick: () => { navigate("/worlds") }, icon: <PublicIcon /> },
    ])

  }
  , [ me ])

  return (
    <MapGridProvider>
      <MapViewProvider>
        <ThemeProvider theme={theme}>
          { /* Use display: flex to make sure the side menu doesn't flow on top of the main box on desktop mode */}
          <Box sx={{ display: "flex", height: '100vh', width: '100vw' }}>
            <Header
              appName='Airplane Navigator'
              icon="S&T.png"
              iconLink="https://mst.edu"
              isLoggedIn={me !== null}
              onLoginClick={login}
              onLogoutClick={logout}
              onMenuClick={() => setMenuOpen(!menuOpen)}
              profileClick={() => { setLoadingSnack("This button currently does nothing "); setTimeout(closeSnack, 5000) }}
              userName={me?.name}
              userAvatarUrl={me?.picture}
            >
            </Header>
            <SideMenu menuItems={menuItems} open={menuOpen} />
            { /* use component='main' to protect this section from display: 'flex' */}
            <Main>
              <Outlet />
            </Main>
            <Footer items={FooterItems} />
          </Box>
        </ThemeProvider>
      </MapViewProvider>
    </MapGridProvider>
  )
}

export default App
