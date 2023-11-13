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
    authority: "https://login.microsoftonline.com/common", // Replace with your tenant ID
    redirectUri: "http://localhost:5173",
  },
  cache: {
    cacheLocation: "sessionStorage", // This configures where your cache will be stored
    storeAuthStateInCookie: true, // Set to true if you are having issues on IE11 or Edge
  },
};

let msalInstance: PublicClientApplication;

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
    msalInstance = new PublicClientApplication(msalConfig);
    msalInstance.initialize().then(() => {
      msalInstance
        .handleRedirectPromise()
        .then((response) => {
          if (response) {
            setAuthResult(response);
          } else {
            const accounts = msalInstance.getAllAccounts();
            if (accounts.length > 0) {
              msalInstance.setActiveAccount(accounts[0]);
              msalInstance
                .acquireTokenSilent({
                  scopes: ["User.Read", "Calendars.ReadWrite"],
                  account: accounts[0],
                })
                .then(setAuthResult)
                .catch((error) => {
                  console.error("Silent token acquisition failed", error);
                  // Optionally initiate interactive login here
                });
            }
          }
        })
        .catch((error) => {
          console.error("Handle redirect error", error);
        });
    });
  }, []);

  const signIn = async () => {
    console.log("signIn 2");
    msalInstance.loginRedirect({
      scopes: ["User.Read", "Calendars.ReadWrite"],
    });
  };

  const signOut = () => {
    msalInstance.logoutRedirect();
  };

  return (
    <AuthContext.Provider value={{ authResult, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
