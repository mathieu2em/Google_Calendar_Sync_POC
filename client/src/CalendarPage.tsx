import React, { useState } from "react";

interface Props {
  token: string | null;
}

const CalendarPage: React.FC<Props> = ({ token }) => {
  const [calendars, setCalendars] = useState<any[]>([]);
  const [events, setEvents] = useState<Record<string, any[]>>({});
  const [unfoldedIndices, setUnfoldedIndices] = useState<number[]>([]); // Track which boxes are unfolded

  const fetchCalendarEvents = (calendarId: string) => {
    if (token) {
      fetch(`/api/events/${encodeURIComponent(calendarId)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          console.log(data);
          setEvents((prevEvents) => ({
            ...prevEvents,
            [calendarId]: data,
          }));
        })
        .catch((error) => {
          console.error(
            `There was an error fetching events for calendar ${calendarId}`,
            error
          );
        });
    } else {
      console.error("No token available");
    }
  };

  const fetchAvailableCalendars = () => {
    if (token) {
      // Use the token to call API methods from the express server
      fetch("/api/calendars", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          console.log(data);
          // Handle the list of calendars returned from the server
          setCalendars(data);
        })
        .catch((error) => {
          console.error(
            "There was an error fetching available calendars",
            error
          );
        });
    } else {
      console.error("No token available");
    }
  };

  const toggleUnfold = (index: number) => {
    setUnfoldedIndices((prevIndices) => {
      if (prevIndices.includes(index)) {
        return prevIndices.filter((i) => i !== index);
      } else {
        return [...prevIndices, index];
      }
    });
  };

  return (
    <div>
      <button onClick={fetchAvailableCalendars}>
        Fetch Available Calendars
      </button>

      {/* Displaying the calendars in boxes */}
      <div>
        {calendars.map((calendar, index) => (
          <div key={index} className="calendar-box">
            <h3 onClick={() => toggleUnfold(index)}>{calendar.summary}</h3>
            {unfoldedIndices.includes(index) && (
              <div>
                <pre>{JSON.stringify(calendar, null, 2)}</pre>
                <div>
                  <button onClick={() => fetchCalendarEvents(calendar.id)}>
                    Fetch Events
                  </button>
                  {events[calendar.id] &&
                    events[calendar.id].map((event) => (
                      <div key={event.id}>
                        {event.summary}
                        {/* Render other event details as needed */}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarPage;
