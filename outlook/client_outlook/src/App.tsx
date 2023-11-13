// DISCLAIMER :

// THIS CODE IS NOTE PRODUCTION READY NOR REPRESENT GOOD CODING PRACTICES

// THE PURPOSE OF THIS CODE IS TO DEMONSTRATE FEASABILITY OF SOME DESIRED FEATURES

// DO NOT USE THIS CODE AS CODEBASE AND DO NOT SEE THIS CODE AS GOOD CODE

// THIS CODE DOEST NOT RESPECT GOOD PRACTICES AND IS CODED AS FAST AS POSSIBLE WITHOUT ANY CONCERN FOR ANYTHING OTHER THAN FUNCTIONALITY
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import CalendarPage from "./CalendarPage";
import AuthProvider from "./AuthProvider"; // Import AuthProvider and useAuth
import SignInButton from "./components/SignInButton";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Pass token as a prop or use Context API */}
          <Route path="/calendar" element={<CalendarPage />} />
          {/* Other routes */}
          <Route path="/" element={<SignInButton />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
