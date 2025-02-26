import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { SnackbarProvider } from "../hooks/useSnackBar"
import { ModalStackProvider } from "../hooks/useModalStack.tsx"
import { AuthProvider, RedirectPage } from '../hooks/useAuth0.tsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import DataViewContainer from '../components/DataViewContainer.tsx'
import EsriMap from './EsriMap.tsx'
import HomePage from './views/ViewHome.tsx'
import AboutPage from './views/ViewAbout.tsx'


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
        element: <DataViewContainer viewPanel={<EsriMap />} controlPanel={<HomePage />}></DataViewContainer>
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
      }
    ]
  }
])


createRoot(document.getElementById('root')!).render(
  <RouterProvider router={router}></RouterProvider>
)
