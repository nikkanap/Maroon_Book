"use client";

import navStyles from "~/styles/nav.module.css";

import NavigationBar from "~/app/_components/navigationBar";
import Image from "next/image";
import { LinkButton } from "~/app/_components/links";

import { useState, useRef, useEffect, useContext } from "react";
import NotificationDropdown from "~/app/user/components/notificationDropdown";
import { NotificationContext } from "~/app/NotificationContext";

type UserNavBarProps = {
  scope: "student" | "employee";
};

export default function UserNavBar({ scope }: UserNavBarProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const { notifications } = useContext(NotificationContext);
  
  const hasNotifications = notifications.length > 0;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);



  return (
    <NavigationBar>
      <LinkButton href={`/user/${scope}/`} className={navStyles.navLink}>
        Dashboard
      </LinkButton>

      <LinkButton href={`/user/${scope}/courses`} className={navStyles.navLink}>
        Courses
      </LinkButton>

      {/* <LinkButton href={`/user/${scope}/notifications`} className={navStyles.navLink}>
        <Image
          src="/images/notification_false.png"
          alt="notification"
          width={20}
          height={20}
        />
      </LinkButton> */}

      <div ref={notifRef} className={navStyles.navLink} style={{ position: "relative" }}>
        <button
          onClick={() => setNotifOpen(prev => !prev)}
          className={navStyles.navLink}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
          }}
        >
          <Image
            src={hasNotifications ? "/images/notification_true.png" : "/images/notification_false.png"}
            alt="notification"
            width={20}
            height={20}
          />
        </button>

        {notifOpen && <NotificationDropdown />}
      </div>

      <LinkButton href={`/user/${scope}/profile`} className={navStyles.navLink}>
        Profile
      </LinkButton>
    </NavigationBar>
  );
}
