// DISCLAIMER : 

// THIS CODE IS NOTE PRODUCTION READY NOR REPRESENT GOOD CODING PRACTICES

// THE PURPOSE OF THIS CODE IS TO DEMONSTRATE FEASABILITY OF SOME DESIRED FEATURES

// DO NOT USE THIS CODE AS CODEBASE AND DO NOT SEE THIS CODE AS GOOD CODE 

// THIS CODE DOEST NOT RESPECT GOOD PRACTICES AND IS CODED AS FAST AS POSSIBLE WITHOUT ANY CONCERN FOR ANYTHING OTHER THAN FUNCTIONALITY
require('dotenv').config({path: './vars/.env'});
const express = require('express');
const {google} = require('googleapis');
const session = require('express-session');

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
app.post('/api/createCalendar', (req, res) => {
    if (!req.session.tokens && !req.headers.authorization) {
        return res.status(401).send("Unauthorized");
    }

    const token = req.session.tokens ? req.session.tokens.access_token : req.headers.authorization.split(" ")[1];
    oauth2Client.setCredentials({ access_token: token });

    const calendarDetails = {
        summary: req.body.summary,  // Assumes you send 'summary' in the request payload.
    };

    calendar.calendars.insert({
        requestBody: calendarDetails
    }, (err, response) => {
        if (err) return res.status(500).send(err);
        res.send(response.data);
    });
});

// Endpoint to delete a calendar
app.delete('/api/deleteCalendar/:calendarId', (req, res) => {
    if (!req.session.tokens && !req.headers.authorization) {
        return res.status(401).send("Unauthorized");
    }

    const token = req.session.tokens ? req.session.tokens.access_token : req.headers.authorization.split(" ")[1];
    oauth2Client.setCredentials({ access_token: token });

    const calendarId = req.params.calendarId;

    calendar.calendars.delete({
        calendarId: calendarId
    }, (err, response) => {
        if (err) return res.status(500).send(err);
        res.send({ message: 'Calendar deleted successfully.' });
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
    if (!req.session.tokens && !req.headers.authorization) {
        return res.status(401).send("Unauthorized");
    }

    const token = req.session.tokens ? req.session.tokens.access_token : req.headers.authorization.split(" ")[1];
    oauth2Client.setCredentials({ access_token: token });

    const eventDetails = {
        summary: req.body.eventName,
        description: req.body.description,
        location: req.body.location,
        start: {
            dateTime: req.body.startTime,
            timeZone: 'EST', 
        },
        end: {
            dateTime: req.body.endTime,
            timeZone: 'EST', 
        },
        recurrence: req.body.recurrence ? [req.body.recurrence] : undefined,
    };

    calendar.events.insert({
        calendarId: req.params.calendarId,
        requestBody: eventDetails
    }, (err, response) => {
        if (err) return res.status(500).send(err);
        res.send(response.data);
    });
});

app.put('/api/editEvent/:calendarId/:eventId', (req, res) => {
    if (!req.session.tokens && !req.headers.authorization) {
        return res.status(401).send("Unauthorized");
    }

    const token = req.session.tokens ? req.session.tokens.access_token : req.headers.authorization.split(" ")[1];
    oauth2Client.setCredentials({ access_token: token });

    const eventDetails = {
        summary: req.body.summary || "", // Use req.body.summary for the summary field
        description: req.body.description || "", // Use req.body.description for the description field
        location: req.body.location || "", // Use req.body.location for the location field
        start: {
            dateTime: req.body.start.dateTime || "", // Use req.body.start.dateTime for the start.dateTime field
            timeZone: 'EST',
        },
        end: {
            dateTime: req.body.end.dateTime || "", // Use req.body.end.dateTime for the end.dateTime field
            timeZone: 'EST',
        },
        recurrence: req.body.recurrence ? [req.body.recurrence] : undefined,
    };
    
    calendar.events.update({
        calendarId: req.params.calendarId,
        eventId: req.params.eventId,
        requestBody: eventDetails
    }, (err, response) => {
        if (err) return res.status(500).send(err);
        res.send(response.data);
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