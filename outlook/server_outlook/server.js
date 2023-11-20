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

app.post('/api/createEvent/:calendarId', async (req, res) => {
    try {
        // Retrieve the access token from the request header
        const accessToken = req.headers.authorization.split(' ')[1];

        if (!accessToken) {
            return res.status(401).send('Access Token is required');
        }

        // Endpoint to Microsoft Graph API to create a new event
        const url = `https://graph.microsoft.com/v1.0/me/calendars/${req.params.calendarId}/events`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(req.body),
        });

        if (!response.ok) {
            throw new Error(`Error creating event: ${response.statusText}`);
        }

        const responseData = await response.json();
        res.send(responseData);
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).send(error.message);
    }
});


app.put('/api/editEvent/:calendarId/:eventId', async (req, res) => {
    try {
        // Retrieve the access token from the request header
        const accessToken = req.headers.authorization.split(' ')[1];

        if (!accessToken) {
            return res.status(401).send('Access Token is required');
        }

        // Retrieve calendarId and eventId from request parameters
        const { calendarId, eventId } = req.params;

        // Endpoint to Microsoft Graph API to update an event
        const url = `https://graph.microsoft.com/v1.0/me/calendars/${calendarId}/events/${eventId}`;

        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(req.body),
        });

        console.log(req.body);

        if (!response.ok) {
            throw new Error(`Error updating event: ${response.statusText}`);
        }

        const responseData = await response.json();
        res.send(responseData);
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).send(error.message);
    }
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

app.get('/api/calendar/:calendarId/event/:eventId', async (req, res) => {
    try {
        // Retrieve the access token from the request header
        const accessToken = req.headers.authorization?.split(' ')[1];

        if (!accessToken) {
            return res.status(401).send('Access Token is required');
        }

        const { calendarId, eventId } = req.params;

        if (!calendarId || !eventId) {
            return res.status(400).send('Calendar ID and Event ID are required');
        }

        // Endpoint to Microsoft Graph API to fetch an event
        const url = `https://graph.microsoft.com/v1.0/me/calendars/${calendarId}/events/${eventId}`;

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Error fetching event: ${response.statusText}`);
        }

        const eventData = await response.json();
        res.send(eventData);
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).send(error.message);
    }
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