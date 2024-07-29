const express = require('express');
const path = require('path');
const WebSocket = require('ws');

const app = express();
const PORT = 3002;

const favicon = require('serve-favicon');

let switchState = 'off'; // Initialize switch state in memory
let serverLogs = []; // Store server logs in memory


const logMessage = (message) => {
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp} - ${message}`;
    console.log(logEntry);
    serverLogs.push(logEntry);
    serverLogs.push('\n')
    if (serverLogs.length > 100) {
        serverLogs.shift(); // Keep the last 100 logs
    }
};

app.use(express.static('public'));
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

// HTTP route to serve the current switch state
app.get('/switch-state', (req, res) => {
    res.send(switchState);
});

// HTTP route to fetch server logs
app.get('/server-logs', (req, res) => {
    res.json(serverLogs);
});

const server = app.listen(PORT, () => {
    logMessage(`Server is running on http://localhost:${PORT}`);
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    logMessage('Client connected');
    // Send the current state to the new client
    ws.send(switchState);

    ws.on('message', (message) => {
        logMessage(`Received message: ${message}`);
        message = `${message}`;
        switchState = message; // Update the state in memory
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
