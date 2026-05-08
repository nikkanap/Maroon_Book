"use client";

import { createContext, type ReactNode, useEffect, useState } from "react";
import type { Course, UserExamData } from "./data/data";
import { api } from "~/trpc/client";

export type BaseUser = {
    id: number;
    firstName: string;
    middleName: string;
    lastName: string;
    email: string;
    authToken: string;
    notify: {
        signature: string;
        nonce: string;
    };
};

export type StudentUser = {
    type: "student";
    details: {
        campus: string;
        program: string;
    };
} & BaseUser;

export type EmployeeUser = {
    type: "employee";
    details: {
        campus: string;
        division: string;
    };
} & BaseUser;

export type UserData = StudentUser | EmployeeUser;

export const UserContext = createContext<{
    baseUser: UserData | null;
    setBaseUser: (user: UserData | null) => void;
    courses: Course[];
    userExams: UserExamData[];
    refreshCourses: () => void;
    logout: () => void;
}>({
    baseUser: null,
    setBaseUser: () => void 0,
    courses: [],
    userExams: [],
    refreshCourses: () => void 0,
    logout: () => void 0,
});

export function UserProvider({ children }: { children: ReactNode }) {
    const [ baseUser, setBaseUser ] = useState<UserData | null>(null);
    const [ courses, setCourses ] = useState<Course[]>([]);
    const [ userExams, setUserExams ] = useState<UserExamData[]>([]);

    function logout() {
        setBaseUser(null);
        setCourses([]);
        setUserExams([]);
        localStorage.removeItem("baseUser");
    }

    function refreshCourses() {
        if (!baseUser) return;
        
        if (baseUser.type === 'employee') {
            api.user.getEmployeeCourses.query({ token: baseUser.authToken }).then(response => {
                if (response.status === 'ok') {
                    setCourses(response.data);
                } else {
                    console.error("Failed to refresh courses:", response.message);
                }
            }).catch(error => {
                console.error("Error refreshing courses:", error);
            });

            api.user.getEmployeeExams.query({ token: baseUser.authToken }).then(response => {
                if (response.status === 'ok') {
                    setUserExams(response.data);
                } else {
                    console.error("Failed to refresh employee exams:", response.message);
                }
            }).catch(error => {
                console.error("Error refreshing employee exams:", error);
            });
        } else {
            api.user.getStudentCourses.query({ token: baseUser.authToken }).then(response => {
                if (response.status === 'ok') {
                    setCourses(response.data);
                } else {
                    console.error("Failed to refresh courses:", response.message);
                }
            }).catch(error => {
                console.error("Error refreshing courses:", error);
            });

            api.user.getStudentExams.query({ token: baseUser.authToken }).then(response => {
                if (response.status === 'ok') {
                    setUserExams(response.data);
                } else {
                    console.error("Failed to refresh student exams:", response.message);
                }
            }).catch(error => {
                console.error("Error refreshing student exams:", error);
            });
        }
    }
    
    useEffect(() => {
        const savedBaseUser = localStorage.getItem("baseUser");
        if (savedBaseUser) {
            setBaseUser(JSON.parse(savedBaseUser) as UserData);
        }

        refreshCourses();
    }, []);

    useEffect(() => {
        if (baseUser) {
            localStorage.setItem("baseUser", JSON.stringify(baseUser));
            refreshCourses();
        } else {
            logout();
        }
    }, [baseUser]);
    
    return (
        <UserContext.Provider value={{
            baseUser,
            setBaseUser,
            courses,
            userExams,
            refreshCourses,
            logout,
        }}>
            { children }
        </UserContext.Provider>
    );
}
