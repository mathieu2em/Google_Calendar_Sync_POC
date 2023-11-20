// DISCLAIMER : 

// THIS CODE IS NOTE PRODUCTION READY NOR REPRESENT GOOD CODING PRACTICES

// THE PURPOSE OF THIS CODE IS TO DEMONSTRATE FEASABILITY OF SOME DESIRED FEATURES

// DO NOT USE THIS CODE AS CODEBASE AND DO NOT SEE THIS CODE AS GOOD CODE 

// THIS CODE DOEST NOT RESPECT GOOD PRACTICES AND IS CODED AS FAST AS POSSIBLE WITHOUT ANY CONCERN FOR ANYTHING OTHER THAN FUNCTIONALITY
require('dotenv').config({path: './vars/.env'});
const express = require('express');
const session = require('express-session');
require('isomorphic-fetch'); // Needed for Microsoft Graph client

const app = express();
const PORT = 3000;

app.use(express.json());

// Use express-session for handling sessions
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
}));

app.get('/api/calendars', async (req, res) => {
    try {
        // Retrieve the access token from the request header
        const accessToken = req.headers.authorization.split(' ')[1];

        if (!accessToken) {
            return res.status(401).send('Access Token is required');
        }

        let url = 'https://graph.microsoft.com/v1.0/me/calendars';
        let allCalendars = [];

        while (url) {
            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Error fetching calendars: ${response.statusText}`);
            }

            const data = await response.json();
            allCalendars = allCalendars.concat(data.value);

            url = data['@odata.nextLink']; // Update the URL if there is a next page
        }

        res.json(allCalendars);
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).send(error.message);
    }
});

  
  app.post('/api/createCalendar', async (req, res) => {
    try {
        // Retrieve the access token from the request header
        const accessToken = req.headers.authorization.split(' ')[1];

        if (!accessToken) {
            return res.status(401).send('Access Token is required');
        }

        // Payload for creating a new calendar
        const calendarData = {
            name: req.body.name, // Make sure this aligns with what you're sending from the frontend
            canEdit:false,
        };

        // Endpoint to Microsoft Graph API to create a calendar
        const url = 'https://graph.microsoft.com/v1.0/me/calendars';

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(calendarData),
        });

        if (!response.ok) {
            throw new Error(`Error creating calendar: ${response.statusText}`);
        }

        const newCalendar = await response.json();
        res.json({ message: 'Calendar created successfully', calendar: newCalendar });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).send(error.message);
    }
});

app.delete('/api/deleteCalendar/:calendarId', async (req, res) => {
    try {
        // Retrieve the access token from the request header
        const accessToken = req.headers.authorization.split(' ')[1];

        if (!accessToken) {
            return res.status(401).send('Access Token is required');
        }

        // Retrieve the calendar ID from the request parameters
        const calendarId = req.params.calendarId;

        if (!calendarId) {
            return res.status(400).send('Calendar ID is required');
        }

        // Endpoint to Microsoft Graph API to delete a calendar
        const url = `https://graph.microsoft.com/v1.0/me/calendars/${calendarId}`;

        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Error deleting calendar: ${response.statusText}`);
        }

        res.send({ message: 'Calendar deleted successfully' });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).send(error.message);
    }
});

app.get('/api/events/:calendarId', async (req, res) => {
    try {
        const accessToken = req.headers.authorization.split(' ')[1];

        if (!accessToken) {
            return res.status(401).send('Access Token is required');
        }

        const calendarId = req.params.calendarId;
        let url = `https://graph.microsoft.com/v1.0/me/calendars/${calendarId}/events`;
        let allEvents = [];

        while (url) {
            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Error fetching events: ${response.statusText}`);
            }

            const data = await response.json();
            allEvents = allEvents.concat(data.value);

            url = data['@odata.nextLink']; // Update the URL if there is a next page
        }

        res.json(allEvents);
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).send(error.message);
    }
});

// Endpoint to create a new event in a specific calendar
app.post('/api/createEvent/:calendarId', (req, res) => {
    console.log(req.body);
    if (!req.session.tokens && !req.headers.authorization) {
        return res.status(401).send("Unauthorized");
    }

    const token = req.session.tokens ? req.session.tokens.access_token : req.headers.authorization.split(" ")[1];
    oauth2Client.setCredentials({ access_token: token });

    // Make sure you're passing the summary in the request body
    if (!req.body.summary) {
        return res.status(400).send("Bad Request: Missing 'summary' in the event details.");
    }

    const eventDetails = {
        summary: req.body.summary,
        description: req.body.description,
        location: req.body.location,
        start: {
            dateTime: req.body.start.dateTime ,
            timeZone: 'America/New_York',
        },
        end: {
            dateTime: req.body.end.dateTime ,
            timeZone: 'America/New_York',
        },
        recurrence: req.body.recurrence ? req.body.recurrence : undefined,
    };

    console.log(eventDetails);

    calendar.events.insert({
        calendarId: req.params.calendarId,
        requestBody: eventDetails
    }, (err, response) => {
        if (err && err.code === 403) {
            serviceAccountCalendar.createEvent(req.params.calendarId, eventDetails).then((reponseData) => {
                res.send(reponseData);
            });
        }
        else if (err) {
            console.error('The API returned an error: ' + err);
            return res.status(500).send(err);
        }
        else {
            res.send(response.data);
        }
    });
});

// Endpoint to edit a specific event from a calendar
app.put('/api/editEvent/:calendarId/:eventId', (req, res) => {
    if (!req.session.tokens && !req.headers.authorization) {
        return res.status(401).send("Unauthorized");
    }

    const token = req.session.tokens ? req.session.tokens.access_token : req.headers.authorization.split(" ")[1];
    oauth2Client.setCredentials({ access_token: token });

    const eventDetails = {
        summary: req.body.summary || "No Title", // Provide a default title if none is given
        description: req.body.description || "",
        location: req.body.location || "",
        start: {
            dateTime: req.body.start.dateTime,
            timeZone: 'America/New_York',
        },
        end: {
            dateTime: req.body.end.dateTime,
            timeZone: 'America/New_York',
        },
        // Update with a new array for recurrence only if provided
        recurrence: req.body.recurrence ? req.body.recurrence : undefined,
    };

    // Logging the event details for debugging purposes
    console.log(eventDetails);

    calendar.events.update({
        calendarId: req.params.calendarId,
        eventId: req.params.eventId,
        requestBody: eventDetails
    }, (err, response) => {
        if (err && err.code === 403) {
            serviceAccountCalendar.editEvent(req.params.calendarId, req.params.eventId, eventDetails).then((reponseData) => {
                res.send(reponseData);
            });
        }
        else if (err) {
            console.error('Error updating event: ', err);
            return res.status(500).send(err);
        }
        else {
            res.send(response.data);
        }
    });
});

app.delete('/api/deleteEvent/:calendarId/:eventId', async (req, res) => {
    try {
        // Retrieve the access token from the request header
        const accessToken = req.headers.authorization.split(' ')[1];

        if (!accessToken) {
            return res.status(401).send('Access Token is required');
        }

        // Retrieve calendarId and eventId from request parameters
        const { calendarId, eventId } = req.params;

        if (!calendarId || !eventId) {
            return res.status(400).send('Calendar ID and Event ID are required');
        }

        // Endpoint to Microsoft Graph API to delete an event
        const url = `https://graph.microsoft.com/v1.0/me/calendars/${calendarId}/events/${eventId}`;

        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Error deleting event: ${response.statusText}`);
        }

        res.send({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).send(error.message);
    }
});

// Endpoint to fetch a specific event from a calendar
app.get('/api/calendar/:calendarId/event/:eventId', (req, res) => {
    if (!req.session.tokens && !req.headers.authorization) {
        return res.status(401).send("Unauthorized");
    }

    // Prioritize session tokens. If not available, use the token from the Authorization header.
    const token = req.session.tokens ? req.session.tokens.access_token : req.headers.authorization.split(" ")[1];
    oauth2Client.setCredentials({ access_token: token });

    calendar.events.get({
        calendarId: req.params.calendarId,
        eventId: req.params.eventId,
    }, (err, response) => {
        if (err) return res.status(500).send(err);
        res.send(response.data);
    });
});

// Endpoint to set default reminders for a calendar
app.patch('/api/setCalendarReminders/:calendarId', async (req, res) => {
    if (!req.session.tokens && !req.headers.authorization) {
        return res.status(401).send("Unauthorized");
    }

    const token = req.session.tokens ? req.session.tokens.access_token : req.headers.authorization.split(" ")[1];
    oauth2Client.setCredentials({ access_token: token });

    const calendarId = req.params.calendarId;
    const reminders = req.body.reminders; // This should be an array of reminder objects

    try {
        const calendarResponse = await calendar.calendars.patch({
            calendarId: calendarId,
            requestBody: {
                defaultReminders: reminders
            }
        });

        res.send({
            message: 'Default reminders set successfully.',
            calendar: calendarResponse.data
        });
    } catch (err) {
        console.error('Error setting reminders: ', err);
        res.status(500).send(err);
    }
});

app.listen(PORT, () => {
    console.log(`App is listening on http://localhost:${PORT}`);
});