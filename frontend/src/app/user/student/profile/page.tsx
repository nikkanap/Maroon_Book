"use client";
import { UserContext } from "~/app/UserContext";
import styles from "./page.module.css";
import sharedStyles from "~/app/user/components/shared.module.css";
import Nav from "~/app/user/components/userNav";
import { useContext } from "react";
import { LinkButton } from "~/app/_components/links";

export default function StudentProfile() {
    const { baseUser } = useContext(UserContext);

    if (!baseUser) return <p>No user is logged in</p>;
    if (baseUser.type !== "student") return <p>User logged in is not a student</p>;

    const fullName = baseUser.firstName + " " + baseUser.middleName.charAt(0) + ". " + baseUser.lastName;

    return (
        <div className="page">
            <Nav scope="student" />

            <main className={`${sharedStyles.main} main`}>
                <div className={styles.leftDiv}>
                    <p className="title22px">User Details</p>

                    <label>Name</label>
                    <p>{fullName}</p>

                    <label>Country</label>
                    <p>Philippines</p>

                    <label>Campus</label>
                    <p>{baseUser.details.campus}</p>

                    <label>Program</label>
                    <p>{baseUser.details.program}</p>

                    <label>Role</label>
                    <p>Student</p>
                </div>

                <div className={styles.rightDiv}>
                    <p className="title22px">User Actions</p>

                    <LinkButton href="/" className="">
                        Log Out
                    </LinkButton>

                    <LinkButton href="#" className="">
                        Edit Profile
                    </LinkButton>
                </div>
            </main>
        </div>
    );
}
