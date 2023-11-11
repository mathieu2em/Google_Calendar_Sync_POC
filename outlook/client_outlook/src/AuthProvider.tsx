// AuthProvider.tsx
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import {
  PublicClientApplication,
  Configuration,
  AuthenticationResult,
} from "@azure/msal-browser";

export const msalConfig: Configuration = {
  auth: {
    clientId: "40890ffb-56fa-427e-b3ca-37a602713284", // Replace with your client ID
    authority:
      "https://login.microsoftonline.com/e5e9996e-6b9b-4ed5-b8e3-51ff270fbc0e", // Replace with your tenant ID
    redirectUri: "http://localhost:3000/auth/callback",
  },
  cache: {
    cacheLocation: "sessionStorage", // This configures where your cache will be stored
    storeAuthStateInCookie: true, // Set to true if you are having issues on IE11 or Edge
  },
};

const msalInstance = new PublicClientApplication(msalConfig);

// Context for auth state
interface AuthContextType {
  authResult: AuthenticationResult | null;
  signIn: () => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  authResult: null,
  signIn: () => {},
  signOut: () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const useAuth = () => useContext(AuthContext);

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authResult, setAuthResult] = useState<AuthenticationResult | null>(
    null
  );

  useEffect(() => {
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      msalInstance.setActiveAccount(accounts[0]);
    }
  }, []);

  const signIn = () => {
    msalInstance
      .loginPopup({
        scopes: ["User.Read", "Calendars.Read"],
      })
      .then((response) => {
        setAuthResult(response);
      })
      .catch((error: any) => {
        console.error("Login failed", error);
      });
  };

  const signOut = () => {
    msalInstance
      .logoutPopup()
      .then(() => {
        setAuthResult(null);
      })
      .catch((error: any) => {
        console.error("Logout failed", error);
      });
  };

  return (
    <AuthContext.Provider value={{ authResult, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
