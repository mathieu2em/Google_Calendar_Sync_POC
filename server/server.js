// DISCLAIMER : 

// THIS CODE IS NOTE PRODUCTION READY NOR REPRESENT GOOD CODING PRACTICES

// THE PURPOSE OF THIS CODE IS TO DEMONSTRATE FEASABILITY OF SOME DESIRED FEATURES

// DO NOT USE THIS CODE AS CODEBASE AND DO NOT SEE THIS CODE AS GOOD CODE 

// THIS CODE DOEST NOT RESPECT GOOD PRACTICES AND IS CODED AS FAST AS POSSIBLE WITHOUT ANY CONCERN FOR ANYTHING OTHER THAN FUNCTIONALITY
require('dotenv').config({path: './vars/.env'});
const express = require('express');
const {google} = require('googleapis');
const session = require('express-session');
const serviceAccountCalendar = require('./serviceAccountCalendar.js')

const app = express();
const PORT = 3000;
const OAuth2 = google.auth.OAuth2;

app.use(express.json());

// Use express-session for handling sessions
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
}));

const oauth2Client = new OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    'http://localhost:3000/auth/callback'
);

// Setup the Google Calendar API
const calendar = google.calendar({version: 'v3', auth: oauth2Client});

app.get('/api/', (req, res) => {
    if (!req.session.tokens) {
        return res.redirect('/api/auth');
    }
    oauth2Client.setCredentials(req.session.tokens);
    calendar.events.list({
        calendarId: 'primary',
    }, (err, response) => {
        if (err) return res.status(500).send(err);
        res.send(response.data.items);
    });
});

app.get('/api/auth', (req, res) => {
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar']
    });
    res.redirect(url);
});

app.get('/api/calendars', (req, res) => {
    if (!req.session.tokens && !req.headers.authorization) {
        return res.status(401).send("Unauthorized");
    }
    
    // Prioritize session tokens. If not available, use the token from the Authorization header.
    const token = req.session.tokens ? req.session.tokens.access_token : req.headers.authorization.split(" ")[1];
    oauth2Client.setCredentials({ access_token: token });

    calendar.calendarList.list({}, (err, response) => {
        if (err) return res.status(500).send(err);
        res.send(response.data.items);
    });
});

// Endpoint to create a new calendar
app.post('/api/createCalendar', async (req, res) => {
    if (!req.session.tokens && !req.headers.authorization) {
        return res.status(401).send("Unauthorized");
    }

    const token = req.session.tokens ? req.session.tokens.access_token : req.headers.authorization.split(" ")[1];
    oauth2Client.setCredentials({ access_token: token });

    /*
    const calendarDetails = {
        summary: req.body.summary,  // Assumes you send 'summary' in the request payload.
    };

    try {
        const createResponse = await calendar.calendars.insert({
            requestBody: calendarDetails
        });

        // Une fois que le calendrier est créé, vous pouvez configurer les ACLs pour que l'utilisateur soit en lecture seule.
        const aclResponse = await calendar.acl.insert({
            calendarId: createResponse.data.id,
            requestBody: {
                role: 'reader',  // Définit le rôle sur 'reader' pour une permission en lecture seule.
                scope: {
                    type: 'user',
                    value: 'm.perron@t-b.ca' ,  // Remplacez ceci par l'email de l'utilisateur réel.
                },
            },
        });

        res.send({
            calendar: createResponse.data,
            acl: aclResponse.data,
        });
    } catch (err) {
        console.error('Error creating calendar or setting permissions', err);
        res.status(500).send(err);
    }
    */
    try {
        serviceAccountCalendar.createShareAndInsertCalendar('m.perron@t-b.ca', req.body.summary, calendar).then((calendarId) => {
            console.log(calendarId);
        })
        res.send({ message: 'Calendar created successfully.' });
    }
    catch { (err) => {
        console.error(err);
    }}
    
});

// Endpoint to delete a calendar
app.delete('/api/deleteCalendar/:calendarId', (req, res) => {
    if (!req.session.tokens && !req.headers.authorization) {
        return res.status(401).send("Unauthorized");
    }

    const token = req.session.tokens ? req.session.tokens.access_token : req.headers.authorization.split(" ")[1];
    oauth2Client.setCredentials({ access_token: token });

    const calendarId = req.params.calendarId;

    // First, try deleting the calendar using the OAuth token.
    calendar.calendars.delete({
        calendarId: calendarId
    }, (err, response) => {
        // If the deletion is not authorized with the user's token, try the service account
        if (err && err.code === 403) {
            serviceAccountCalendar.deleteCalendar(calendarId).then(() => {
                res.send({ message: 'Calendar deleted successfully with service account.' });
            }).catch((serviceErr) => {
                console.error('Error with service account deletion: ', serviceErr);
                res.status(500).send(serviceErr);
            });
        } else if (err) {
            console.error('The API returned an error: ' + err);
            return res.status(500).send(err);
        } else {
            res.send({ message: 'Calendar deleted successfully.' });
        }
    });
});

// New method to fetch events from a specific calendar
app.get('/api/events/:calendarId', (req, res) => {
    if (!req.session.tokens && !req.headers.authorization) {
        return res.status(401).send("Unauthorized");
    }

    // Prioritize session tokens. If not available, use the token from the Authorization header.
    const token = req.session.tokens ? req.session.tokens.access_token : req.headers.authorization.split(" ")[1];
    oauth2Client.setCredentials({ access_token: token });

    calendar.events.list({
        calendarId: req.params.calendarId,
    }, (err, response) => {
        if (err) return res.status(500).send(err);
        res.send(response.data.items);
    });
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

// Endpoint to delete a specific event from a calendar
app.delete('/api/deleteEvent/:calendarId/:eventId', (req, res) => {
    if (!req.session.tokens && !req.headers.authorization) {
        return res.status(401).send("Unauthorized");
    }

    const token = req.session.tokens ? req.session.tokens.access_token : req.headers.authorization.split(" ")[1];
    oauth2Client.setCredentials({ access_token: token });

    const { calendarId, eventId } = req.params;

    calendar.events.delete({
        calendarId: calendarId,
        eventId: eventId,
    }, (err, response) => {
        // If the deletion is not authorized with the user's token, try the service account
        if (err && err.code === 403) {
            serviceAccountCalendar.deleteEvent(calendarId, eventId).then((responseData) => {
                res.send({ message: 'Event deleted successfully with service account.' });
            }).catch((serviceErr) => {
                console.error('Error with service account deletion: ', serviceErr);
                res.status(500).send(serviceErr);
            });
        } else if (err) {
            console.error('The API returned an error: ' + err);
            return res.status(500).send(err);
        } else {
            res.send({ message: 'Event deleted successfully.' });
        }
    });
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

app.get('/auth/callback', (req, res) => {
    const code = req.query.code;
    oauth2Client.getToken(code, (err, tokens) => {
        if (err) {
            console.error('Error authenticating', err);
            return res.status(500).send(err);
        }
        // Redirect to the CalendarPage in frontend with token as a parameter
        res.redirect(`http://localhost:5173/calendar?token=${tokens.access_token}`);
    });
});

app.listen(PORT, () => {
    console.log(`App is listening on http://localhost:${PORT}`);
});