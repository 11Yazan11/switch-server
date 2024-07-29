const express = require('express');
const path = require('path');
const WebSocket = require('ws');
const favicon = require('serve-favicon');

const app = express();
const PORT = process.env.PORT || 3002; // Use environment variable for port or default to 3002

let switchState = 'off'; // Initialize switch state in memory
let serverLogs = []; // Store server logs in memory

// Function to log messages with timestamps
const logMessage = (message) => {
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp} - ${message}`;
    console.log(logEntry);
    serverLogs.push('\n');
    serverLogs.push(logEntry);
    if (serverLogs.length > 100) {
        serverLogs.shift(); // Keep the last 100 logs
    }
};

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Use serve-favicon middleware
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

// HTTP route to serve the current switch state
app.get('/switch-state', (req, res) => {
    res.send(switchState);
});

// HTTP route to fetch server logs
app.get('/server-logs', (req, res) => {
    res.json(serverLogs);
});

// Create and start the server
const server = app.listen(PORT, () => {
    logMessage(`Server is running on http://localhost:${PORT}`);
});

// Set up WebSocket server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    logMessage('Client connected');
    // Send the current state to the new client
    ws.send(switchState);

    ws.on('message', (message) => {
        logMessage(`Received message: ${message}`);
        switchState = `${message}`; // Update the state in memory
        // Broadcast the new state to all connected clients
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(switchState);
            }
        });
    });

    ws.on('close', () => {
        logMessage('Client disconnected');
    });
});
