import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { SnackbarProvider } from "../hooks/useSnackBar"
import { ModalStackProvider } from "../hooks/useModalStack.tsx"
import { AuthProvider, RedirectPage } from '../hooks/useAuth0.tsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import AirplaneList from './views/AirplaneList.tsx'
import DataViewContainer from '../components/DataViewContainer.tsx'
import HomePage from './views/ViewHome.tsx'
import AboutPage from './views/ViewAbout.tsx'
import { MapGrid } from './GridMap.tsx'
import WorldList from "./views/ViewWorldList.tsx"
import UserList from "./views/ViewUserList.tsx"
import FlightlogList from "./views/ViewFlightlog.tsx"

const Index: React.FC = () => {
  return (

    <SnackbarProvider>
      <AuthProvider>
        <ModalStackProvider>
          <App />
        </ModalStackProvider>
      </AuthProvider>
    </SnackbarProvider>
  )
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Index />,
    children: [
      {
        path: "",
        element: <DataViewContainer viewPanel={<MapGrid />} controlPanel={<HomePage />}></DataViewContainer>
      },
      {
        path: "/about",
        element: <AboutPage/>
      },
      {
        path: "/auth/set-token",
        element: <RedirectPage></RedirectPage>
      },
      {
        path: "/error",
        element: <div>404</div>
      },
      {
        path: "/users",
        element: <DataViewContainer viewPanel={<MapGrid />} controlPanel={<UserList />}></DataViewContainer>,
      },
      {
        path: "/users/:id/flightlog",
        element:<DataViewContainer viewPanel={<MapGrid />} controlPanel={<FlightlogList />}></DataViewContainer>,
      },
      {
        path: "/worlds",
        element: <DataViewContainer viewPanel={<MapGrid />} controlPanel={<WorldList />}></DataViewContainer>,
  

      },
      {
        path: "/worlds/:id",
        element: <DataViewContainer viewPanel={<MapGrid />} controlPanel={<AirplaneList />}></DataViewContainer>
      }
    ]
  }
])


createRoot(document.getElementById('root')!).render(
  <RouterProvider router={router}></RouterProvider>
)
