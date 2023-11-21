/* eslint-disable @typescript-eslint/no-explicit-any */
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isLoadingDeleteCalendar, setIsLoadingDeleteCalendar] = useState(false);
  const { getAuthToken, authResult } = useAuth(); // Use authResult from useAuth

  useEffect(() => {
    if (authResult) {
      fetchAvailableCalendars();
    }
  }, [authResult]); // Fetch calendars when authResult changes

  const fetchAvailableCalendars = () => {
    getAuthToken()
      .then((token) => {
        fetch("/api/calendars", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
          .then((response) => response.json())
          .then((data) => {
            console.log(data);
            setCalendars(data);
          })
          .catch((error) => {
            console.error("Error fetching calendars:", error);
          });
      })
      .catch((error) => {
        console.error("Error getting auth token:", error);
      });
  };

  const createNewCalendar = () => {
    setIsLoadingCalendar(true);
    getAuthToken()
      .then((token) => {
        fetch("/api/createCalendar", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: newCalendarName }),
        })
          .then((response) => {
            if (response.ok) {
              fetchAvailableCalendars();
              setNewCalendarName("");
            }
            return response.json();
          })
          .catch((error) => {
            // Handle any errors here, maybe set an error state or log the error
            console.error("Error creating new calendar:", error);
          })
          .finally(() => setIsLoadingCalendar(false));
      })
      .catch((error) => {
        // Handle errors related to getAuthToken
        console.error("Error getting auth token:", error);
      });
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

  const deleteEvent = (calendarId: string, eventId: string, index: number) => {
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
            setUnfoldedIndices((prevIndices) => {
              if (!prevIndices.includes(index)) {
                return [...prevIndices, index];
              }
              return prevIndices;
            });
          }
        })
        .catch((error) => {
          console.error("Error deleting event:", error);
        });
    }
  };

  const fetchCalendarEvents = (calendarId: string, index: number) => {
    setIsLoadingEvents(true); // Assuming you have a state to track loading of events
    getAuthToken()
      .then((token) => {
        const url = `/api/events/${encodeURIComponent(calendarId)}`;
        fetch(url, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
          })
          .then((data) => {
            console.log(data);
            setEvents((prevEvents) => ({
              ...prevEvents,
              [calendarId]: data,
            }));
            setUnfoldedIndices((prevIndices) => {
              if (!prevIndices.includes(index)) {
                return [...prevIndices, index];
              }
              return prevIndices;
            });
          })
          .catch((error) => {
            console.error(
              `Error fetching events for calendar ${calendarId}:`,
              error
            );
          })
          .finally(() => setIsLoadingEvents(false));
      })
      .catch((error) => {
        console.error("Error getting auth token:", error);
      });
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
    <div className="bg">
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
          <div
            key={index}
            className="calendar-box"
            onClick={() => toggleUnfold(index)}
          >
            <div className="calendar-header">
              <h3>{calendar.name}</h3>
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
                {/*!-- Display the calendar object with id cutted at 50 char max */}
                <pre>
                  {JSON.stringify(
                    { ...calendar, id: calendar.id?.slice(0, 50) + "..." },
                    null,
                    2
                  )}
                </pre>
                <div id="box">
                  {/* Redirect to the EventPage for creating a new event */}
                  <Link to={`${calendar.id}/event/create`}>
                    Create New Event
                  </Link>
                  <br />
                  <button
                    onClick={() => fetchCalendarEvents(calendar.id, index)}
                  >
                    Fetch Events
                  </button>
                  <br />
                  {events[calendar.id] &&
                    events[calendar.id].map((event) => (
                      <div key={event.id} id="event">
                        {event.subject}
                        <Link
                          to={`${calendar.id}/event/${event.id}/edit`}
                          id="event-elem1"
                        >
                          Edit
                        </Link>
                        {/* Add a button to delete the event */}
                        <button
                          onClick={() =>
                            deleteEvent(calendar.id, event.id, index)
                          }
                          id="event-elem2"
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
