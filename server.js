const express = require('express');
const {google} = require('googleapis');
const session = require('express-session');
require('dotenv').config();

const app = express();
const PORT = 3000;
const OAuth2 = google.auth.OAuth2;

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

app.get('/', (req, res) => {
    if (!req.session.tokens) {
        return res.redirect('/auth');
    }
    oauth2Client.setCredentials(req.session.tokens);
    calendar.events.list({
        calendarId: 'primary',
    }, (err, response) => {
        if (err) return res.status(500).send(err);
        res.send(response.data.items);
    });
});

app.get('/auth', (req, res) => {
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: 'https://www.googleapis.com/auth/calendar.events'
    });
    res.redirect(url);
});

app.get('/auth/callback', (req, res) => {
    const code = req.query.code;
    oauth2Client.getToken(code, (err, tokens) => {
        if (err) {
            console.error('Error authenticating', err);
            return res.status(500).send(err);
        }
        req.session.tokens = tokens;
        res.redirect('/');
    });
});

app.listen(PORT, () => {
    console.log(`App is listening on http://localhost:${PORT}`);
});