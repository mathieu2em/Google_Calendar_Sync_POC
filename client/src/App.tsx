// src/App.tsx

import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import CalendarPage from './CalendarPage';

const App: React.FC = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  return (
    <Router>
      <Routes>
        <Route path="/calendar" element={<CalendarPage token={token} />} />
        <Route path="/" element={
          <body className="App">
            <button onClick={() => window.location.href = "/api/auth"}>
              Connect to Google Calendar
            </button>
          </body>
        } />
      </Routes>
    </Router>
  );
}

export default App;
