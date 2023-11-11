// DISCLAIMER :

// THIS CODE IS NOT PRODUCTION READY NOR REPRESENT GOOD CODING PRACTICES

// THE PURPOSE OF THIS CODE IS TO DEMONSTRATE FEASABILITY OF SOME DESIRED FEATURES

// DO NOT USE THIS CODE AS CODEBASE AND DO NOT SEE THIS CODE AS GOOD CODE

// THIS CODE DOES NOT RESPECT GOOD PRACTICES AND IS CODED AS FAST AS POSSIBLE WITHOUT ANY CONCERN FOR ANYTHING OTHER THAN FUNCTIONALITY
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./AuthProvider"; // Import useAuth

const CalendarPage: React.FC = () => {
  const [calendars, setCalendars] = useState<any[]>([]);
  const [events, setEvents] = useState<Record<string, any[]>>({});
  const [unfoldedIndices, setUnfoldedIndices] = useState<number[]>([]); // Track which boxes are unfolded
  const [newCalendarName, setNewCalendarName] = useState<string>(""); // Name for the new calendar
  //const [newEventName, setNewEventName] = useState<string>(""); // Name for the new event
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  //const [isLoadingEvent, setIsLoadingEvent] = useState(false);
  const [isLoadingDeleteCalendar, setIsLoadingDeleteCalendar] = useState(false);
  const { authResult } = useAuth(); // Use authResult from useAuth

  useEffect(() => {
    if (authResult) {
      fetchAvailableCalendars();
    }
  }, [authResult]); // Fetch calendars when authResult changes

  const createNewCalendar = () => {
    setIsLoadingCalendar(true);
    if (authResult) {
      fetch("/api/createCalendar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authResult.accessToken}`,
        },
        body: JSON.stringify({ summary: newCalendarName }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.id) {
            fetchAvailableCalendars();
          }
        })
        .finally(() => setIsLoadingCalendar(false));
    } else {
      setIsLoadingCalendar(false);
    }
  };

  const deleteCalendar = (calendarId: string) => {
    setIsLoadingDeleteCalendar(true);
    if (authResult && window.confirm("ARE YOU SURE TO DELETE THIS CALENDAR?")) {
      fetch(`/api/deleteCalendar/${encodeURIComponent(calendarId)}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authResult.accessToken}`,
        },
      })
        .then((response) => {
          if (response.ok) {
            fetchAvailableCalendars();
          }
        })
        .finally(() => setIsLoadingDeleteCalendar(false));
    } else {
      setIsLoadingDeleteCalendar(false);
    }
  };

  const deleteEvent = (calendarId: string, eventId: string) => {
    if (
      authResult &&
      window.confirm("Are you sure you want to delete this event?")
    ) {
      fetch(
        `/api/deleteEvent/${encodeURIComponent(
          calendarId
        )}/${encodeURIComponent(eventId)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${authResult.accessToken}`,
          },
        }
      )
        .then((response) => {
          if (response.ok) {
            setEvents((prevEvents) => ({
              ...prevEvents,
              [calendarId]: prevEvents[calendarId].filter(
                (event) => event.id !== eventId
              ),
            }));
          }
        })
        .catch((error) => {
          console.error("Error deleting event:", error);
        });
    }
  };

  const fetchCalendarEvents = (calendarId: string) => {
    if (authResult) {
      fetch(`/api/events/${encodeURIComponent(calendarId)}`, {
        headers: {
          Authorization: `Bearer ${authResult.accessToken}`,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          setEvents((prevEvents) => ({
            ...prevEvents,
            [calendarId]: data,
          }));
        })
        .catch((error) => {
          console.error(
            `Error fetching events for calendar ${calendarId}:`,
            error
          );
        });
    }
  };

  const fetchAvailableCalendars = () => {
    if (authResult) {
      fetch("/api/calendars", {
        headers: {
          Authorization: `Bearer ${authResult.accessToken}`,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          setCalendars(data);
        })
        .catch((error) => {
          console.error("Error fetching calendars:", error);
        });
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
      {/* Create a New Calendar form */}
      <h2>Create a New Calendar</h2>
      <div>
        <input
          type="text"
          value={newCalendarName}
          onChange={(e) => setNewCalendarName(e.target.value)}
          placeholder="Enter calendar name"
        />
        <button
          onClick={createNewCalendar}
          disabled={isLoadingCalendar} // Disable button when loading
        >
          {isLoadingCalendar ? "Creating..." : "Create Calendar"}
          {/* Show loading text when creating */}
        </button>
      </div>

      <button onClick={fetchAvailableCalendars}>
        Fetch Available Calendars
      </button>

      {/* Displaying the calendars in boxes */}
      <div>
        {calendars.map((calendar, index) => (
          <div key={index} className="calendar-box">
            <div className="calendar-header">
              <h3 onClick={() => toggleUnfold(index)}>{calendar.summary}</h3>
              <button
                className="delete-btn"
                onClick={() => deleteCalendar(calendar.id)}
                disabled={isLoadingDeleteCalendar}
              >
                {isLoadingDeleteCalendar ? "..." : "❌"}
              </button>
            </div>
            {unfoldedIndices.includes(index) && (
              <div>
                <pre>{JSON.stringify(calendar, null, 2)}</pre>
                <div>
                  {/* Redirect to the EventPage for creating a new event */}
                  <Link to={`${calendar.id}/event/create`}>
                    Create New Event
                  </Link>
                  <br />
                  <button onClick={() => fetchCalendarEvents(calendar.id)}>
                    Fetch Events
                  </button>
                  {events[calendar.id] &&
                    events[calendar.id].map((event) => (
                      <div key={event.id}>
                        {event.summary}
                        <Link to={`${calendar.id}/event/${event.id}/edit`}>
                          Edit
                        </Link>
                        {/* Add a button to delete the event */}
                        <button
                          onClick={() => deleteEvent(calendar.id, event.id)}
                        >
                          Delete
                        </button>
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
