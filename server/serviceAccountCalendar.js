// serviceAccountCalendar.js
const { google } = require('googleapis');
const serviceAccount = require('./service-account-credentials.json');

// Initialize the auth client using the service account
const authClient = new google.auth.JWT({
  email: serviceAccount.client_email,
  key: serviceAccount.private_key,
  scopes: [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
  ],
  // subject: 'user@example.com', // uncomment if you need to impersonate a user
});

const serviceAccountCalendar = google.calendar({ version: 'v3', auth: authClient });

// Function to create calendar and share it with the user
async function createShareAndInsertCalendar(userEmail, calendar) {
  try {
    // Create a new calendar
    const calendarResponse = await serviceAccountCalendar.calendars.insert({
      requestBody: {
        summary: 'Tasks Calendar',
        description: 'Calendar for user tasks',
      }
    });

    const calendarId = calendarResponse.data.id;

    // Share the calendar with the user
    await serviceAccountCalendar.acl.insert({
      calendarId: calendarId,
      requestBody: {
        role: 'reader', // 'reader' role for read-only access
        scope: {
          type: 'user',
          value: userEmail, // User's email to share with
        },
      },
    });

    // Insert the calendar into the user's CalendarList
    await calendar.calendarList.insert({
        requestBody: {
            id: calendarId,
        },
    });

    // Return the calendar ID which can be used by the user to add to their Google Calendar
    return calendarId;
  } catch (error) {
    console.error('The API returned an error: ' + error);
    throw error;
  }
}

const createEvent = async (calendarId, eventDetails) => {
    try {
      const response = await serviceAccountCalendar.events.insert({
        calendarId,
        requestBody: eventDetails,
      });
      return response.data;
    } catch (error) {
      console.error('Error creating event: ', error);
      throw error; // Rethrow the error to be handled by the caller
    }
};  

  const editEvent = async (calendarId, eventId, eventDetails) => {
    try {
      const response = await serviceAccountCalendar.events.update({
        calendarId,
        eventId,
        requestBody: eventDetails,
      });
      return response.data;
    } catch (error) {
      console.error('Error updating event: ', error);
      throw error; // Rethrow the error to be handled by the caller
    }
};

module.exports = {
    createShareAndInsertCalendar,
    createEvent,
    editEvent

};