import express from 'express';
import http from 'http';
import { type WebSocket, WebSocketServer } from 'ws';
import crypto from 'crypto';

// Salt for hashing
// This should normally be behind an env variable
// but for this demo application we can just
// hardcode it tbh - James
const salt = 'maroon-book-salt';

enum MessageType {
    CONNECTION = 'connection',
    NOTIFY = 'notify',
};

type UserRole = 'employee' | 'student';

type UserData = {
    id: string;
    role: UserRole;
};

type MessageBase<TType extends MessageType, TPayload> = {
    type: TType;
    payload: TPayload;
};

type ConnectionMessage = MessageBase<MessageType.CONNECTION, {
    user: {
        id: string;
        role: UserRole;
    },
    auth: {
        signature: string;
        nonce: string;
    }
}>;

type NotifyMessage = MessageBase<MessageType.NOTIFY, {
    audience: {
        userIds: string[];
        signature: string;
    },
    data: unknown;
}>;

function validateConnectionNonce(nonce: string): boolean {
    const parts = nonce.split('-');
    if (parts.length !== 2) {
        return false;
    }

    const [ timestamp, userId ] = parts;

    const nonceTime = parseInt(timestamp!, 10);
    const lastTime = lastUsedNonce.get(userId!) || 0;

    if (isNaN(nonceTime) || nonceTime <= lastTime) {
        return false;
    }

    lastUsedNonce.set(userId!, nonceTime);
    return true;
}

function validateConnection(message: ConnectionMessage): boolean {
    const { user, auth } = message.payload;
    const expectedSignature = crypto.createHash('sha256');
    expectedSignature.update(salt + user.id + user.role + auth.nonce);
    const computedSignature = expectedSignature.digest('hex');
    return computedSignature === auth.signature;
}

function validateNotify(message: NotifyMessage): boolean {
    const { audience, data } = message.payload;
    const expectedSignature = crypto.createHash('sha256');
    expectedSignature.update(salt + audience.userIds.join(',') + JSON.stringify(data));
    const computedSignature = expectedSignature.digest('hex');
    return computedSignature === audience.signature;
}

const connections = new Map<string, { id: string, ws: WebSocket, user: UserData }[]>();
const lastUsedNonce = new Map<string, number>();

const app = express();
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
    console.log('[maroon-book] [backend] New WebSocket connection established');

    let isAuthenticated = false;
    let authTimeout = setTimeout(() => {
        if (!isAuthenticated) {
            console.log('[maroon-book] [backend] Authentication timeout, closing connection');
            ws.close();
        }
    }, 5000);

    let connectionId: string = crypto.randomUUID();
    let userId: string | null = null;
    let userRole: UserRole | null = null;

    function removeConnection() {
        if (userId && connections.has(userId)) {
            const newConnections = connections.get(userId)?.filter((connection) => connection.id !== connectionId);

            if (!newConnections || newConnections.length === 0) {
                connections.delete(userId);
            } else if (newConnections) {
                connections.set(userId, newConnections);
            }
        }
    }

    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data.toString());

            if (message.type === MessageType.CONNECTION) {
                const connectionMessage = message as ConnectionMessage;
                if (validateConnection(connectionMessage)) {
                    if (!validateConnectionNonce(connectionMessage.payload.auth.nonce)) {
                        console.log('[maroon-book] [backend] Invalid nonce, closing connection');
                        ws.send(JSON.stringify({ type: 'error', payload: { message: 'Invalid nonce' } }));
                        ws.close();
                        return;
                    }

                    ws.send(JSON.stringify({ type: 'connected', payload: { message: 'Connection established' } }));

                    isAuthenticated = true;
                    clearTimeout(authTimeout);
                    console.log('[maroon-book] [backend] Client authenticated successfully');
                    userId = connectionMessage.payload.user.id;
                    userRole = connectionMessage.payload.user.role;

                    if (!connections.has(userId)) {
                        connections.set(userId, []);
                    }

                    connections.get(userId)!.push({ id: connectionId, ws, user: { id: userId, role: userRole } });
                } else {
                    console.log('[maroon-book] [backend] Invalid authentication, closing connection');
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Invalid auth' } }));
                    ws.close();
                }
            } else if (message.type === MessageType.NOTIFY) {
                const notifyMessage = message as NotifyMessage;
                if (validateNotify(notifyMessage)) {
                    const { audience, data } = notifyMessage.payload;
                    const userIds = audience.userIds;

                    if (userIds.length === 1 && userIds[0] === '*') {
                        for (const [_, userConnections] of connections.entries()) {
                            for (const connection of userConnections) {
                                connection.ws.send(JSON.stringify({ type: MessageType.NOTIFY, payload: { data } }));
                            }
                        }
                    } else {
                        for (const userId of userIds) {
                            if (connections.has(userId)) {
                                const userConnections = connections.get(userId)!;
                                for (const connection of userConnections) {
                                    connection.ws.send(JSON.stringify({ type: MessageType.NOTIFY, payload: { data } }));
                                }
                            }
                        }
                    }
                }
            } else if (!isAuthenticated) {
                console.log('[maroon-book] [backend] [backend] Received message before authentication, closing connection');
                ws.send(JSON.stringify({ type: 'error', payload: { message: 'Not authed' } }));
                ws.close();
            }
        } catch (error) {
            console.log('[maroon-book] [backend] Error processing message:', error);
            ws.send(JSON.stringify({ type: 'error', payload: { message: 'Invalid message' } }));
        }
    });

    ws.on('close', () => {
        console.log('[maroon-book] [backend] WebSocket connection closed');
        removeConnection();
    });
});

// HTTP endpoint to send notifications
app.post('/api/notify', (req, res) => {
    try {
        const { userIds, data } = req.body;

        if (!Array.isArray(userIds) || !data) {
            return res.status(400).json({ error: 'Invalid request body' });
        }

        // Send notification to all specified users
        const userIdsStr = userIds.map((id: number) => id.toString());
        let notifiedCount = 0;

        if (userIdsStr.length === 1 && userIdsStr[0] === '*') {
            // Broadcast to all connected users
            for (const [_, userConnections] of connections.entries()) {
                for (const connection of userConnections) {
                    connection.ws.send(JSON.stringify({ type: MessageType.NOTIFY, payload: { data } }));
                    notifiedCount++;
                }
            }
        } else {
            // Send to specific users
            for (const userId of userIdsStr) {
                if (connections.has(userId)) {
                    const userConnections = connections.get(userId)!;
                    for (const connection of userConnections) {
                        connection.ws.send(JSON.stringify({ type: MessageType.NOTIFY, payload: { data } }));
                        notifiedCount++;
                    }
                }
            }
        }

        console.log(`[maroon-book] [backend] Sent notification to ${notifiedCount} connection(s) for ${userIdsStr.length} user(s)`);

        res.json({ success: true, notified: notifiedCount });
    } catch (error) {
        console.error('[maroon-book] [backend] Error sending notification:', error);
        res.status(500).json({ error: 'Failed to send notification' });
    }
});

server.listen(3001, () => {
    console.log('[maroon-book] [backend] Server is listening on port 3001');
});
