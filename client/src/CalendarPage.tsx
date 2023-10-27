// DISCLAIMER :

// THIS CODE IS NOT PRODUCTION READY NOR REPRESENT GOOD CODING PRACTICES

// THE PURPOSE OF THIS CODE IS TO DEMONSTRATE FEASABILITY OF SOME DESIRED FEATURES

// DO NOT USE THIS CODE AS CODEBASE AND DO NOT SEE THIS CODE AS GOOD CODE

// THIS CODE DOES NOT RESPECT GOOD PRACTICES AND IS CODED AS FAST AS POSSIBLE WITHOUT ANY CONCERN FOR ANYTHING OTHER THAN FUNCTIONALITY
import React, { useState } from "react";
import { Link } from "react-router-dom";

interface Props {
  token: string | null;
}

const CalendarPage: React.FC<Props> = ({ token }) => {
  const [calendars, setCalendars] = useState<any[]>([]);
  const [events, setEvents] = useState<Record<string, any[]>>({});
  const [unfoldedIndices, setUnfoldedIndices] = useState<number[]>([]); // Track which boxes are unfolded
  const [newCalendarName, setNewCalendarName] = useState<string>(""); // Name for the new calendar
  const [newEventName, setNewEventName] = useState<string>(""); // Name for the new event
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  const [isLoadingEvent, setIsLoadingEvent] = useState(false);
  const [isLoadingDeleteCalendar, setIsLoadingDeleteCalendar] = useState(false);

  const createNewCalendar = () => {
    setIsLoadingCalendar(true); // Set loading
    if (token) {
      fetch("/api/createCalendar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ summary: newCalendarName }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log(data);
          if (data.id) {
            // Refetch the available calendars to show the new one
            fetchAvailableCalendars();
          }
        })
        .finally(() => setIsLoadingCalendar(false)); // Reset loading at the end;
    } else {
      setIsLoadingCalendar(false);
    }
  };

  const deleteCalendar = (calendarId: string) => {
    setIsLoadingDeleteCalendar(true);
    // Show the confirmation popup
    const isConfirmed = window.confirm(
      "ARE YOU SURE TO PERMANENTLY DELETE THIS CALENDAR? DELETION IS PERMANENT!!!"
    );

    // Proceed with the deletion only if the user confirms
    if (isConfirmed && token) {
      fetch(`/api/deleteCalendar/${encodeURIComponent(calendarId)}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => {
          if (response.ok) {
            // Refetch the calendars to update the list after deletion
            fetchAvailableCalendars();
          } else {
            console.error("Error deleting calendar.");
          }
        })
        .finally(() => setIsLoadingDeleteCalendar(false));
    } else {
      setIsLoadingDeleteCalendar(false);
    }
  };

  const createNewEvent = (calendarId: string) => {
    setIsLoadingEvent(true); // Set loading
    if (token) {
      fetch(`/api/createEvent/${encodeURIComponent(calendarId)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ eventName: newEventName }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            // Refetch the events for the specific calendar
            fetchCalendarEvents(calendarId);
          }
        })
        .finally(() => setIsLoadingEvent(false));
    } else {
      setIsLoadingEvent(false);
    }
  };

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
