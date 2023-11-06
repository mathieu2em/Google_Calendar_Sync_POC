import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "./EventPage.css";

interface Props {
  token: string | null;
}

const EventPage: React.FC<Props> = ({ token }) => {
  const { calendarId, eventId } = useParams<{
    calendarId?: string;
    eventId?: string;
  }>();

  const [eventName, setEventName] = useState<string>("");
  const [eventData, setEventData] = useState<any | null>(null);
  const [description, setDescription] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [recurrence, setRecurrence] = useState<string>("");
  const [frequency, setFrequency] = useState<string | undefined>(undefined);
  const [interval, setInterval] = useState<number>(1);
  const [endType, setEndType] = useState<"never" | "count" | "date">("never");
  const [endAfter, setEndAfter] = useState<number>(1);
  const [endDate, setEndDate] = useState<Date | null>(null);

  /**
   * To create en event in google calendar we need the calendarId
   * @param calendarId The Id of the calendar in which to create an event.
   */
  const createEvent = async (calendarId: string) => {
    try {
      const response = await fetch(`/api/createEvent/${calendarId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          summary: eventName,
          description: description,
          location: location,
          start: { dateTime: startTime },
          end: { dateTime: endTime },
          recurrence: recurrence ? [recurrence] : undefined,
        }),
      });

      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error("Error creating event:", error);
    }
  };

  const updateEvent = async (calendarId: string, eventId: string) => {
    try {
      const response = await fetch(`/api/editEvent/${calendarId}/${eventId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          summary: eventName,
          description: description,
          location: location,
          start: { dateTime: startTime },
          end: { dateTime: endTime },
          recurrence: recurrence ? [recurrence] : undefined,
        }),
      });

      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error("Error updating event:", error);
    }
  };

  useEffect(() => {
    if (calendarId && eventId && token) {
      // Fetch the event data based on calendarId and eventId
      fetch(`/api/calendar/${calendarId}/event/${eventId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          setEventData(data);
        })
        .catch((error) => {
          console.error("There was an error fetching the event data", error);
        });
    }
  }, [calendarId, eventId, token]);

  useEffect(() => {
    if (eventData) {
      setEventName(eventData.summary);
      setDescription(eventData.description || "");
      setLocation(eventData.location || "");
      setStartTime(eventData.start.dateTime || "");
      setEndTime(eventData.end.dateTime || "");
      setRecurrence(eventData.recurrence ? eventData.recurrence[0] : ""); // Assuming a single recurrence rule
    }
  }, [eventData]);

  const handleRRULESubmit = () => {
    let rrule = `RRULE:FREQ=${frequency}`;

    if (interval > 1) {
      rrule += `;INTERVAL=${interval}`;
    }

    if (endType === "count") {
      rrule += `;COUNT=${endAfter}`;
    } else if (endType === "date" && endDate) {
      rrule += `;UNTIL=${endDate.toISOString()}`;
    }

    setRecurrence(rrule); // Set the recurrence based on the user's selections
  };

  const handleSubmit = () => {
    if (eventId) {
      // Update the event. If it's recurring, this will affect all upcoming instances.
      updateEvent(calendarId!, eventId); // You'll have to define this function.
    } else {
      // Call the create event API
      createEvent(calendarId!); // You'll have to define this function.
    }
  };

  return (
    <div className="container">
      <h2>{eventId ? "Edit Event | " + eventName : "Create New Event"}</h2>

      <label>
        Event Name:
        <input
          type="text"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          placeholder="Event Name"
        />
      </label>

      <label>
        Description:
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
        />
      </label>

      <label>
        Location:
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Location"
        />
      </label>

      <label>
        Start Time:
        <input
          type="datetime-local"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          placeholder="Start Time"
        />
      </label>

      <label>
        End Time:
        <input
          type="datetime-local"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          placeholder="End Time"
        />
      </label>

      <div className="recurrence-container">
        <label>
          Frequency:
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
          >
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
            <option value="YEARLY">Yearly</option>
          </select>
        </label>

        <label>
          Interval:
          <input
            type="number"
            value={interval}
            onChange={(e) => setInterval(Number(e.target.value))}
          />
        </label>

        <label>
          End:
          <select
            value={endType}
            onChange={(e) => setEndType(e.target.value as any)}
          >
            <option value="never">Never</option>
            <option value="count">After X occurrences</option>
            <option value="date">On a specific date</option>
          </select>
        </label>

        {endType === "count" && (
          <input
            type="number"
            value={endAfter}
            onChange={(e) => setEndAfter(Number(e.target.value))}
          />
        )}

        {endType === "date" && (
          <input
            type="date"
            value={endDate?.toISOString().substring(0, 10)}
            onChange={(e) => setEndDate(new Date(e.target.value))}
          />
        )}

        <button onClick={handleRRULESubmit}>Set Recurrence</button>
      </div>

      {eventData && eventData.recurrence && (
        <p className="warning">
          Changes to this event will apply to all future instances.
        </p>
      )}
      <button onClick={handleSubmit}>
        {eventId ? "Update Event" : "Create Event"}
      </button>
    </div>
  );
};

export default EventPage;
