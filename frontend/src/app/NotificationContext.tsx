"use client";

import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { UserContext } from "./UserContext";
import { api } from "~/trpc/react";

export type Notification = {
    id: string;
    message: string;
    timestamp: Date;
    data?: unknown;
};

type NotificationContextType = {
    notifications: Notification[];
    connectionStatus: "disconnected" | "connecting" | "connected" | "error";
    clearNotifications: () => void;
};

export const NotificationContext = createContext<NotificationContextType>({
    notifications: [],
    connectionStatus: "disconnected",
    clearNotifications: () => void 0,
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { baseUser, setBaseUser, refreshCourses } = useContext(UserContext);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected" | "error">("disconnected");
    
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const maxReconnectAttempts = 5;

    const clearNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    const refreshNotifyToken = useCallback(async (): Promise<{ signature: string; nonce: string } | null> => {
        if (!baseUser?.authToken) return null;

        try {
            const result = await api.user.getNotifyToken.query({ token: baseUser.authToken });
            if (result.status === 'ok') {
                // Update the user with new notify credentials
                const updatedUser = {
                    ...baseUser,
                    notify: result.data,
                };
                setBaseUser(updatedUser);
                return result.data;
            }
            return null;
        } catch (error) {
            console.error("Failed to refresh notify token:", error);
            return null;
        }
    }, [baseUser, setBaseUser]);

    const connectWebSocket = useCallback(async () => {
        if (!baseUser || !baseUser.notify) {
            setConnectionStatus("disconnected");
            return;
        }

        // Close existing connection if any
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        setConnectionStatus("connecting");

        try {
            const ws = new WebSocket("ws://localhost:3001/ws");
            wsRef.current = ws;

            ws.onopen = () => {
                console.log("[WebSocket] Connection opened");
                reconnectAttemptsRef.current = 0;

                // Authenticate immediately
                const authMessage = {
                    type: "connection",
                    payload: {
                        user: {
                            id: baseUser.id.toString(),
                            role: baseUser.type,
                        },
                        auth: {
                            signature: baseUser.notify.signature,
                            nonce: baseUser.notify.nonce,
                        },
                    },
                };

                ws.send(JSON.stringify(authMessage));
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);

                    if (message.type === "connected") {
                        console.log("[WebSocket] Authenticated successfully");
                        setConnectionStatus("connected");
                    } else if (message.type === "notify") {
                        console.log("[WebSocket] Received notification:", message.payload);
                        refreshCourses();
                        // Format notification message
                        let notificationMessage: string;
                        if (typeof message.payload.data === "string") {
                            notificationMessage = message.payload.data;
                        } else if (message.payload.data && typeof message.payload.data === "object") {
                            // Try to extract a message field, or format the object nicely
                            if ("message" in message.payload.data && typeof message.payload.data.message === "string") {
                                notificationMessage = message.payload.data.message;
                            } else if ("title" in message.payload.data && typeof message.payload.data.title === "string") {
                                notificationMessage = message.payload.data.title;
                            } else {
                                notificationMessage = JSON.stringify(message.payload.data);
                            }
                        } else {
                            notificationMessage = "New notification";
                        }
                        
                        const notification: Notification = {
                            id: crypto.randomUUID(),
                            message: notificationMessage,
                            timestamp: new Date(),
                            data: message.payload.data,
                        };
                        setNotifications((prev) => [notification, ...prev]);
                    } else if (message.type === "error") {
                        console.error("[WebSocket] Error from server:", message.payload);
                        
                        // If authentication failed, try to refresh token
                        if (message.payload.message === "Invalid auth" || message.payload.message === "Invalid nonce") {
                            console.log("[WebSocket] Authentication failed, attempting to refresh token...");
                            refreshNotifyToken().then((newCredentials) => {
                                if (newCredentials && wsRef.current?.readyState === WebSocket.OPEN && baseUser) {
                                    // Retry authentication with new credentials
                                    const authMessage = {
                                        type: "connection",
                                        payload: {
                                            user: {
                                                id: baseUser.id.toString(),
                                                role: baseUser.type,
                                            },
                                            auth: {
                                                signature: newCredentials.signature,
                                                nonce: newCredentials.nonce,
                                            },
                                        },
                                    };
                                    wsRef.current.send(JSON.stringify(authMessage));
                                } else {
                                    setConnectionStatus("error");
                                    // Close and attempt to reconnect
                                    if (wsRef.current) {
                                        wsRef.current.close();
                                    }
                                }
                            });
                        } else {
                            setConnectionStatus("error");
                        }
                    }
                } catch (error) {
                    console.error("[WebSocket] Error parsing message:", error);
                }
            };

            ws.onerror = (error) => {
                console.error("[WebSocket] Connection error:", error);
                setConnectionStatus("error");
            };

            ws.onclose = (event) => {
                console.log("[WebSocket] Connection closed", event.code, event.reason);
                wsRef.current = null;
                setConnectionStatus("disconnected");

                // Attempt to reconnect if not a normal closure and user is still logged in
                if (event.code !== 1000 && baseUser && reconnectAttemptsRef.current < maxReconnectAttempts) {
                    reconnectAttemptsRef.current++;
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
                    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
                    
                    reconnectTimeoutRef.current = setTimeout(() => {
                        connectWebSocket();
                    }, delay);
                }
            };
        } catch (error) {
            console.error("[WebSocket] Failed to create connection:", error);
            setConnectionStatus("error");
        }
    }, [baseUser, refreshNotifyToken]);

    // Connect when user logs in, disconnect when user logs out
    useEffect(() => {
        if (baseUser && baseUser.notify) {
            connectWebSocket();
        } else {
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
            setConnectionStatus("disconnected");
            setNotifications([]);
        }

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [baseUser, connectWebSocket]);

    return (
        <NotificationContext.Provider value={{
            notifications,
            connectionStatus,
            clearNotifications,
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

