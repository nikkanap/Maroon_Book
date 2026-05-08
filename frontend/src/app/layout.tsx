import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { UserProvider } from "./UserContext";
import { NotificationProvider } from "./NotificationContext";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Maroon Book",
    description: "UP System EIMS",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en">
            <body className={`${geistSans.variable} ${geistMono.variable}`}>
                <TRPCReactProvider>
                    <UserProvider>
                        <NotificationProvider>
                            {children}
                        </NotificationProvider>
                    </UserProvider>
                </TRPCReactProvider>
            </body>
        </html>
    );
}
