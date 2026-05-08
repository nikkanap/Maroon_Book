"use client";

import styles from "./page.module.css";
import Nav from "~/app/_components/homepageNav";
import Logo from "~/app/_components/logo";
import sharedStyles from "~/styles/shared.module.css";
import { UserRoleToggle, InputContent, type UserRole } from "~/app/_components/sharedComponents";
import { useRouter } from "next/navigation";
import { useContext, useRef, useState } from "react";
import { LinkButton } from "~/app/_components/links";
import { api } from "~/trpc/client";
import { UserContext, type UserData } from "../UserContext";

export default function Register() {
    const router = useRouter();

    const firstNameRef = useRef<HTMLInputElement>(null);
    const middleNameRef = useRef<HTMLInputElement>(null);
    const lastNameRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const confirmPasswordRef = useRef<HTMLInputElement>(null);
    const campusRef = useRef<HTMLInputElement>(null);
    const userNumberRef = useRef<HTMLInputElement>(null);
    const emailRef = useRef<HTMLInputElement>(null);
    const dataRef = useRef<HTMLInputElement>(null);

    const [ showRegister, setShow ] = useState(false);
    const [ showUserRole, setShowUserRole ] = useState(true);
    const [ userRole, setUserRole ] = useState<UserRole>("");
    const [ error, setError ] = useState<string>("");

    const { setBaseUser } = useContext(UserContext);

    const validateRegistration = async () => {
        const internalUserType = userRole === "Employee" ? "employee" : "student";
        
        const id = parseInt(userNumberRef.current?.value ?? "0");

        if (isNaN(id) || id <= 0) {
            setError("Please enter a valid user number.");
            return;
        }

        const result = await api.user.register.mutate({
            id: id,
            firstName: firstNameRef.current?.value ?? "",
            middleName: middleNameRef.current?.value ?? "",
            lastName: lastNameRef.current?.value ?? "",
            password: passwordRef.current?.value ?? "",
            email: emailRef.current?.value ?? "",
            role: internalUserType,
            campus: campusRef.current?.value ?? "",
            programOrDivision: dataRef.current?.value ?? "",
        });

        if (!result || result.status === "error") {
            setError(result?.message || "Failed to register");
            return;
        }

        setBaseUser({
            type: internalUserType,
            ...result.data,
        } as UserData);

        router.push(userRole === "Employee" ? "/user/employee" : "/user/student");
    };

    return (
        <div className={`page ${sharedStyles.imageBackground}`}>
            <Nav />
            <main className="main">
                {showUserRole && (
                    <div className={sharedStyles.centeredDiv}>
                        <Logo width={250} height={28} />
                        <p className="title17px">Registering an Account</p>
                        <hr />

                        <p className="innerTitle">What are you registering as?</p>
                        <div className={sharedStyles.colButtons}>
                            <UserRoleToggle userRole="Employee" setUseStates={{ setShow, setShowUserRole, setUserRole }}/>
                            <UserRoleToggle userRole="Student" setUseStates={{ setShow, setShowUserRole, setUserRole }}/>
                        </div>

                        <LinkButton href="/login" className={sharedStyles.registerLoginLink}>
                            Already have an account? Login here.
                        </LinkButton>
                    </div>
                )}
                {showRegister && (
                    <div className={sharedStyles.centeredDiv}>
                        <Logo width={250} height={28} />
                        <p className={"title17px"}>Registering as Professor</p>
                        <hr />

                        <p className={"innerTitle"}>Personal Information</p>
                        <PersonalInformation
                            firstNameRef={firstNameRef}
                            middleNameRef={middleNameRef}
                            lastNameRef={lastNameRef}
                        />

                        <p className={"innerTitle"}>University Information</p>
                        <DisplayUniversityInformation
                            campusRef={campusRef}
                            userNumberRef={userNumberRef}
                            emailRef={emailRef}
                            dataRef={dataRef}
                            userRole={userRole}
                        />

                        <p className={"innerTitle"}>Password Creation</p>
                        <CreatePassword
                            passwordRef={passwordRef}
                            confirmPasswordRef={confirmPasswordRef}
                        />

                        {error && <p className={sharedStyles.errorText}>{error}</p>}

                        <div className={sharedStyles.rowButtons}>
                            <button 
                                className="primaryButton"
                                onClick={() => {
                                    setShow(false);
                                    setShowUserRole(true);
                                }}
                            >
                                Go Back
                            </button>
                            <button 
                                className="primaryButton"
                                onClick={ validateRegistration }
                            >
                                Create Account
                            </button>
                        </div>

                        <LinkButton href="/login" className={sharedStyles.registerLoginLink}>
                            Already have an account? Login here.
                        </LinkButton>
                    </div>
                )}
            </main>
        </div>
    );
}

function PersonalInformation({
    firstNameRef,
    middleNameRef,
    lastNameRef,
}: {
    firstNameRef: React.RefObject<HTMLInputElement | null>;
    middleNameRef: React.RefObject<HTMLInputElement | null>;
    lastNameRef: React.RefObject<HTMLInputElement | null>;
}) {
    return (
        <div className={styles.container}>
            <InputContent str="First Name" placeholder="E.g. Juan" type="name" ref={firstNameRef} />
            <InputContent str="Middle Name" placeholder="E.g. Marello" type="name" ref={middleNameRef} />
            <InputContent str="Last Name" placeholder="E.g. Dela Cruz" type="name" ref={lastNameRef} />
        </div>
    );
}

function CreatePassword({
    passwordRef,
    confirmPasswordRef,
}: {
    passwordRef: React.RefObject<HTMLInputElement | null>;
    confirmPasswordRef: React.RefObject<HTMLInputElement | null>;
}) {
    return (
        <div className={styles.container}>
            <InputContent str="Password" placeholder="Create a password" type="password" ref={passwordRef} />
            <InputContent str="Confirm Password" placeholder="Retype password" type="password" ref={confirmPasswordRef} />
        </div>
    );
}

function DisplayUniversityInformation({
    campusRef,
    userNumberRef,
    emailRef,
    dataRef,
    userRole,
}: {
    userRole: UserRole;
    campusRef: React.RefObject<HTMLInputElement | null>;
    userNumberRef: React.RefObject<HTMLInputElement | null>;
    emailRef: React.RefObject<HTMLInputElement | null>;
    dataRef: React.RefObject<HTMLInputElement | null>;
}) {
    if(userRole === "Employee") {
        return (
            <>
                <div className={styles.container}>
                    <InputContent str="Campus" placeholder="E.g. Tacloban College" type="text" ref={campusRef} />
                    <InputContent str="Division" placeholder="E.g. DNSM" type="text" ref={dataRef} />
                </div>
                <div className={styles.container}>
                    <InputContent str="Employee Number" placeholder="Enter employee no." type="text" ref={userNumberRef}/>
                    <InputContent str="UP Email Address" placeholder="Format: xxx@up.edu.ph" type="email" ref={emailRef}/>
                </div>
            </>
        );
    } else if(userRole === "Student"){
        return (
            <>
                <div className={styles.container}>
                    <InputContent str="Campus" placeholder="E.g. Tacloban College" type="text" ref={campusRef} />
                    <InputContent str="Program" placeholder="E.g. BS Computer Science" type="text" ref={dataRef} />
                </div>
                <div className={styles.container}>
                    <InputContent str="Student Number" placeholder="Enter student no." type="text" ref={userNumberRef}/>
                    <InputContent str="UP Email Address" placeholder="Format: xxx@up.edu.ph" type="email" ref={emailRef}/>
                </div>
            </>
        );
    } 

    return (
        <div className={styles.container}>
            <p>invalid selection</p>
        </div>
    );
}



