import React from 'react';

interface Props {
  token: string | null;
}

const CalendarPage: React.FC<Props> = ({ token }) => {

  const fetchCalendarEvents = () => {
    if (token) {
      // Use the token to call API methods from the express server
      fetch('/api/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => response.json())
      .then(data => {
        console.log(data);
        // Handle the data returned from the server
      })
      .catch(error => {
        console.error("There was an error fetching calendar events", error);
      });
    } else {
      console.error("No token available");
    }
  };

  return (
    <div>
      <button onClick={fetchCalendarEvents}>
        Fetch Calendar Events
      </button>
    </div>
  );
}

export default CalendarPage;
