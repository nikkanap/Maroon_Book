"use client";

import notifStyles from "./notificationDropdown.module.css";
import { useContext } from "react";
import { NotificationContext } from "~/app/NotificationContext";

export default function NotificationDropdown() {
  const { notifications, connectionStatus, clearNotifications } = useContext(NotificationContext);

  return (
    <div className={notifStyles.notifDropdown}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <p className={notifStyles.notifHeader}>Notifications</p>
        {notifications.length > 0 && (
          <button
            onClick={clearNotifications}
            style={{
              background: "none",
              border: "none",
              color: "#666",
              cursor: "pointer",
              fontSize: "12px",
              textDecoration: "underline",
            }}
          >
            Clear all
          </button>
        )}
      </div>

      {connectionStatus === "connecting" && (
        <div className={notifStyles.notifItem} style={{ color: "#666", fontStyle: "italic" }}>
          Connecting...
        </div>
      )}

      {connectionStatus === "error" && (
        <div className={notifStyles.notifItem} style={{ color: "#d32f2f", fontStyle: "italic" }}>
          Connection error. Attempting to reconnect...
        </div>
      )}

      {connectionStatus === "connected" && notifications.length === 0 && (
        <div className={notifStyles.notifItem} style={{ color: "#666", fontStyle: "italic" }}>
          No notifications
        </div>
      )}

      {notifications.map((notification) => (
        <div key={notification.id} className={notifStyles.notifItem}>
          • {notification.message}
        </div>
      ))}
    </div>
  );
}
