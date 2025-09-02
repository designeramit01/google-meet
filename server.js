// 1. Import all necessary libraries
require('dotenv').config(); // Loads variables from .env file
const express = require('express');
const path = require('path'); // Needed to serve static files like HTML
const { google } = require('googleapis');
const session = require('express-session');

// 2. Initialize the app and set the port
const app = express();
const port = process.env.PORT || 3000;

// This tells Express to serve your static files (html, css, js) from the current directory
app.use(express.static(__dirname));

// 3. Set up session middleware to keep track of user's login status
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
}));

// 4. Configure the Google OAuth2 client with our credentials
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.REDIRECT_URI
);

// 5. Define the "scopes" - what permissions we are asking for
const scopes = [
    'https://www.googleapis.com/auth/calendar.events'
];

// 6. Create the Login Route
// This will redirect the user to Google's login page
app.get('/auth/google', (req, res) => {
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes
    });
    res.redirect(url);
});

// 7. Create the Callback Route
// Google will redirect the user here after they log in
app.get('/auth/google/callback', async (req, res) => {
    const code = req.query.code;
    try {
        const { tokens } = await oauth2Client.getToken(code);
        req.session.tokens = tokens; // Store tokens in the session
        res.redirect('/'); // Redirect back to the main page
    } catch (error) {
        console.error('Error getting access token', error);
        res.send('Error during authentication.');
    }
});

// 8. Add a route to check login status
// Frontend can call this to see if it should show "Login" or "Create Meeting"
app.get('/get-status', (req, res) => {
    if (req.session.tokens) {
        res.json({ loggedIn: true });
    } else {
        res.json({ loggedIn: false });
    }
});
// Add this new route to your server.js

// 8.5. Create the route to handle meeting creation
app.get('/create-meeting', async (req, res) => {
    // First, check if the user is logged in
    if (!req.session.tokens) {
        return res.status(401).json({ error: 'User not authenticated' });
    }

    // Set the credentials for the API call
    oauth2Client.setCredentials(req.session.tokens);

    // Create a new calendar instance
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Define the event details
    const event = {
        summary: 'Instant Meeting',
        description: 'A quick meeting created by the Instant Meet App.',
        start: {
            dateTime: new Date().toISOString(), // Starts now
            timeZone: 'Asia/Kolkata', // Set your timezone
        },
        end: {
            // Ends 1 hour from now
            dateTime: new Date(new Date().getTime() + 60 * 60 * 1000).toISOString(),
            timeZone: 'Asia/Kolkata',
        },
        // This is the magic part that creates the Google Meet link
        conferenceData: {
            createRequest: {
                requestId: 'sample-request-' + Date.now(),
            },
        },
    };

    try {
        // Insert the event into the user's primary calendar
        const response = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
            conferenceDataVersion: 1, // Required to get conference data
        });

        // Send the meeting link back to the frontend
        const meetingLink = response.data.hangoutLink;
        res.json({ link: meetingLink });

    } catch (error) {
        console.error('Error creating calendar event:', error);
        res.status(500).json({ error: 'Failed to create calendar event' });
    }
});

// The app.listen(...) should be the last thing in the file
// 9. Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});