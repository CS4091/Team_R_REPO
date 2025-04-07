import React, { createContext, useContext, useMemo, useEffect, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import { useSnackbar } from "./useSnackBar";
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import CircularProgress from '@material-ui/core/CircularProgress';


function _logout() {
    console.log("Logging out")
    const domain = import.meta.env.VITE_AUTH0_DOMAIN;
    localStorage.removeItem("accessToken")
    const logoutUrl = `https://${domain}/v2/logout?client_id=${import.meta.env.VITE_AUTH0_CLIENT_ID}&returnTo=${encodeURIComponent(
        window.location.origin
    )}`;
    window.location.href = logoutUrl;
}

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
      root: {
        display: 'flex',
        '& > * + *': {
          marginLeft: theme.spacing(2),
        },
      },
    }),
  );

export const RedirectPage = () => {
    const navigate = useNavigate();
    const { setMessageSnack } = useSnackbar();
    const classes = useStyles();

    useEffect(() => {
    

        // Parse the code from the URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        if (!code) {
            setMessageSnack('Authorization code not found in the URL', "error");
            navigate('/error'); // Redirect to an error page or handle the error
            return;
        }
        const redirectUri = import.meta.env.VITE_AUTH0_REDIRECT_URI
        const tokenEndpoint = import.meta.env.VITE_AUTH0_TOKEN_URI

        // Exchange the authorization code for a token
        const exchangeCodeForToken = async () => {
            try {
                const response = await axios.post(tokenEndpoint, {
                    code,
                    redirect_uri: redirectUri
                });

                const { error, token } = response.data;
                console.log(response.data)
                
                if (error) {
                    setTimeout(_logout, 3000)
                    setMessageSnack(error, "error")
                    return
                }

                // Save the token (e.g., in localStorage or a global state)
                localStorage.setItem('accessToken', token);
                setMessageSnack("Login Success", "success");
                setTimeout(() => window.location.href = "/", 3000);
                // Redirect to the main app or a specific page
            } catch (error) {
                setMessageSnack('Login failed to exchange code', "error")
                setTimeout(_logout, 3000)
            }
        };

        if (! localStorage.getItem('accessToken')) {
            exchangeCodeForToken();
        }

    }, [navigate, setMessageSnack]);

    return (
        <div style={{display: 'flex',  justifyContent:'center', alignItems:'center', height: '100vh'}}>
            <div className={classes.root}>
                <CircularProgress />
            </div>
        </div>)
            
};


interface AuthContextProps {
    login: () => void;
    logout: () => void;
    me: UserInfo | null;
}

interface UserInfo {
    given_name: string;
    family_name: string;
    nickname: string;
    name: string;
    picture: string;
    updated_at: string; // ISO 8601 format
    email: string;
    email_verified: boolean;
    iss: string; // Issuer URL
    aud: string; // Audience
    iat: number; // Issued at (Unix timestamp)
    exp: number; // Expiration time (Unix timestamp)
    sub: string; // Subject identifier
    sid: string; // Session ID
    token: string;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

const useAuth0 = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth0 must be used within an AuthProvider");
    }
    return context;
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

    const login = useCallback(() => {
        const domain = import.meta.env.VITE_AUTH0_DOMAIN;
        const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
        const redirectUri = import.meta.env.VITE_AUTH0_REDIRECT_URI;

        const authUrl = `https://${domain}/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid%20profile%20email`;
        window.location.href = authUrl;
    }, []);

    const logout = useCallback(() => {
        const domain = import.meta.env.VITE_AUTH0_DOMAIN;
        localStorage.removeItem("accessToken")
        const logoutUrl = `https://${domain}/v2/logout?client_id=${import.meta.env.VITE_AUTH0_CLIENT_ID}&returnTo=${encodeURIComponent(
            window.location.origin
        )}`;
        window.location.href = logoutUrl;
    },[]);

    const me = useMemo(() => {
        const token = localStorage.getItem("accessToken")
        if (token){    
            const me = jwtDecode<UserInfo>(token);
            me.token = token
            return me
        }
        else {
            return null;
        }
    }, [])


    return (
        <AuthContext.Provider value={{ login, logout, me }}>
            {children}
        </AuthContext.Provider>
    );
};

export { AuthProvider, useAuth0 };
