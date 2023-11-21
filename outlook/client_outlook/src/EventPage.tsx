/* eslint-disable @typescript-eslint/no-explicit-any */
// DISCLAIMER :

// THIS CODE IS NOT PRODUCTION READY NOR REPRESENT GOOD CODING PRACTICES

// THE PURPOSE OF THIS CODE IS TO DEMONSTRATE FEASABILITY OF SOME DESIRED FEATURES

// DO NOT USE THIS CODE AS CODEBASE AND DO NOT SEE THIS CODE AS GOOD CODE

// THIS CODE DOES NOT RESPECT GOOD PRACTICES AND IS CODED AS FAST AS POSSIBLE WITHOUT ANY CONCERN FOR ANYTHING OTHER THAN FUNCTIONALITY
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "./EventPage.css";
import { useAuth } from "./AuthProvider";
import { OutlookCalendarEvent } from "./interfaces/OutlookCalendarEvent";
import {
  RecurrencePattern,
  RecurrenceRange,
} from "./interfaces/OutlookEventsRecurrence";

const EventPage: React.FC = () => {
  const { calendarId, eventId } = useParams<{
    calendarId?: string;
    eventId?: string;
  }>();

  const [eventName, setEventName] = useState<string>("");
  const [eventData, setEventData] = useState<OutlookCalendarEvent | null>(null);
  const [description, setDescription] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [isRecurring, setIsRecurring] = useState<boolean>(false); // New state to track if the event is recurring
  const [recurrencePattern, setRecurrencePattern] = useState<
    RecurrencePattern | undefined
  >();
  const [recurrenceRange, setRecurrenceRange] = useState<
    RecurrenceRange | undefined
  >();
  const [frequency, setFrequency] = useState<string>("DAILY");
  const [endType, setEndType] = useState<"never" | "count" | "date">("never");
  const [endAfter, setEndAfter] = useState<number>(1);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const { getAuthToken, authResult } = useAuth();

  const createEvent = async (calendarId: string) => {
    try {
      const token = await getAuthToken();

      let recurrence;
      console.log(recurrencePattern);
      console.log(recurrenceRange);
      console.log(frequency);
      if (isRecurring) {
        recurrence = {
          pattern: { ...recurrencePattern, type: frequency!.toLowerCase() },
          range: { ...recurrenceRange },
        };
        if (endType === "date" && endDate) {
          recurrence.range.endDate = endDate.toISOString().split("T")[0];
        } else if (endType === "count") {
          recurrence.range.numberOfOccurrences = endAfter;
        }
      }

      const eventData = {
        subject: eventName,
        body: {
          contentType: "HTML",
          content: description,
        },
        start: {
          dateTime: startTime,
          timeZone: "Eastern Standard Time", // Adjust time zone as needed
        },
        end: {
          dateTime: endTime,
          timeZone: "Eastern Standard Time", // Adjust time zone as needed
        },
        recurrence,
        // ... other event properties if required
      };

      const response = await fetch(`/api/createEvent/${calendarId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Event created:", data);
      return data;
    } catch (error) {
      console.error("Error creating event:", error);
      return error;
    }
  };

  const updateEvent = async (calendarId: string, eventId: string) => {
    try {
      const token = await getAuthToken(); // Assuming getAuthToken resolves with the token

      let recurrence;
      if (isRecurring && recurrencePattern && recurrenceRange && frequency) {
        recurrence = {
          pattern: { ...recurrencePattern, type: frequency.toLowerCase() },
          range: { ...recurrenceRange },
        };
        if (endType === "date" && endDate) {
          recurrence.range.endDate = endDate.toISOString().split("T")[0];
        } else if (endType === "count") {
          recurrence.range.numberOfOccurrences = endAfter;
        }
      }

      const eventData = {
        subject: eventName,
        body: {
          contentType: "HTML",
          content: description,
        },
        start: {
          dateTime: new Date(startTime).toISOString(),
          timeZone: "Eastern Standard Time", // Adjust time zone as needed
        },
        end: {
          dateTime: new Date(endTime).toISOString(),
          timeZone: "Eastern Standard Time", // Adjust time zone as needed
        },
        recurrence,
        // ... other event properties
      };

      const response = await fetch(`/api/editEvent/${calendarId}/${eventId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Event updated:", data);
      return data;
    } catch (error) {
      console.error("Error updating event:", error);
      return error;
    }
  };

  useEffect(() => {
    const fetchEventData = async () => {
      if (calendarId && eventId) {
        try {
          const token = await getAuthToken(); // Assuming getAuthToken resolves with the token

          const response = await fetch(
            `/api/calendar/${calendarId}/event/${eventId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          setEventData(data);

          if (data.recurrence) {
            setRecurrencePattern(data.recurrence.pattern);
            setRecurrenceRange(data.recurrence.range);
            const frequency = data.recurrence.pattern.type;
            setFrequency(frequency.toUpperCase()); // Convert to uppercase to match your select options

            // Example: Set end type based on recurrence range
            if (data.recurrence.range.type === "endDate") {
              setEndType("date");
              setEndDate(new Date(data.recurrence.range.endDate));
            } else if (data.recurrence.range.numberOfOccurrences) {
              setEndType("count");
              setEndAfter(data.recurrence.range.numberOfOccurrences);
            } else {
              setEndType("never");
            }
          }
        } catch (error) {
          console.error("There was an error fetching the event data", error);
        }
      }
    };

    fetchEventData();
  }, [calendarId, eventId, authResult, getAuthToken]);

  useEffect(() => {
    if (eventData) {
      setEventName(eventData.subject);
      setDescription(eventData.body.content || "");

      const convertUTCToEST = (utcDateTime: string) => {
        const utcDate = new Date(utcDateTime);
        // EST is UTC-5, but consider daylight saving time
        const estOffset = 5 * 60; // EST offset in minutes
        const estDate = new Date(utcDate.getTime() - estOffset * 60000);

        // Extracting the date and time in 'YYYY-MM-DD' and 'HH:mm' format
        const dateString = estDate.toLocaleDateString("en-CA"); // 'en-CA' uses YYYY-MM-DD format
        const timeString = estDate.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });

        // Combine date and time
        return `${dateString}T${timeString}`;
      };

      console.log(eventData.start.dateTime);
      console.log(convertUTCToEST(eventData.start.dateTime));

      setStartTime(convertUTCToEST(eventData.start.dateTime));
      setEndTime(convertUTCToEST(eventData.end.dateTime));

      // Handle Recurrence
      if (eventData.recurrence) {
        setIsRecurring(true); // Set the recurring flag if the event has recurrence data
        const { pattern, range } = eventData.recurrence;
        setRecurrencePattern(pattern);
        setRecurrenceRange(range);
        setFrequency(pattern.type.toUpperCase()); // Adjust this line as necessary
      } else {
        setIsRecurring(false);
      }
    } else {
      setStartTime(new Date(Date.now()).toISOString().split(".")[0]);
      setEndTime(new Date(Date.now() + 3600000).toISOString().split(".")[0]);
    }
  }, [eventData]);

  const handleSubmit = () => {
    // Convert the startTime and endTime to Date objects for comparison
    const start = new Date(startTime);
    const end = new Date(endTime);

    // Check if the end time is before the start time
    if (end <= start) {
      alert("End time must be after the start time.");
      return; // Prevent form submission
    }

    if (eventId) {
      // Update the event. If it's recurring, this will affect all upcoming instances.
      updateEvent(calendarId!, eventId).then(() => {
        // Redirect to the calendar page after updating the event
        window.location.href = "/calendar";
      }); // You'll have to define this function.
    } else {
      // Call the create event API
      createEvent(calendarId!).then(() => {
        // Redirect to the calendar page after creating the event
        window.location.href = "/calendar";
      }); // You'll have to define this function.
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

      <label>
        Set Recurrence:
        <input
          type="checkbox"
          checked={isRecurring}
          onChange={() => {
            setIsRecurring(!isRecurring);
            if (!isRecurring) {
              console.log("resetting recurrence");
              setRecurrencePattern({ type: "daily", interval: 1 });
              setRecurrenceRange({
                type: "noEnd",
                startDate: new Date().toISOString().split("T")[0],
              });
              setFrequency("DAILY");
              setEndType("never");
            }
          }}
        />
      </label>

      {isRecurring && (
        <div className="recurrence-settings">
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
            <select
              value={recurrencePattern?.interval || 1}
              onChange={(e) => {
                const newInterval = parseInt(e.target.value, 10);
                console.log("new interval : " + newInterval);
                setRecurrencePattern((prevPattern) => ({
                  ...prevPattern, // spread the existing pattern
                  type: prevPattern?.type || "daily", // default type if not set
                  interval: newInterval,
                  // other properties remain unchanged
                }));
              }}
            >
              {[...Array(30)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </label>

          <label>
            End Type:
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
            <label>
              Occurrences:
              <input
                type="number"
                min="1"
                value={endAfter}
                onChange={(e) => setEndAfter(parseInt(e.target.value, 10))}
              />
            </label>
          )}

          {endType === "date" && (
            <label>
              End Date:
              <input
                type="date"
                value={endDate ? endDate.toISOString().substring(0, 10) : ""}
                onChange={(e) => setEndDate(new Date(e.target.value))}
              />
            </label>
          )}
        </div>
      )}

      <div>
        <button onClick={handleSubmit}>
          {eventId ? "Update Event" : "Create Event"}
        </button>
      </div>

      {eventData && eventData.recurrence && (
        <p className="warning">
          Changes to this event will apply to all future instances.
        </p>
      )}
    </div>
  );
};

export default EventPage;
