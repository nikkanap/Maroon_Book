"use client";

import styles from "./page.module.css";

import { useRouter } from "next/navigation";
import { useContext, useEffect, useRef, useState } from "react";
import { UserRoleToggle, InputContent, type UserRole } from "../_components/sharedComponents";
import sharedStyles from "~/styles/shared.module.css";
import { UserContext, type BaseUser, type EmployeeUser, type StudentUser } from "../UserContext";
import Nav from "../_components/homepageNav";
import { LinkButton } from "../_components/links";
import Logo from "../_components/logo";
import { api } from "~/trpc/client";

export default function Login() {
    const [ showLogin, setShow ] = useState(false);
    const [ showUserRole, setShowUserRole ] = useState(true);
    const [ userRole, setUserRole ] = useState<UserRole>("");
    const [ userNumberType, setUserNumberType ] = useState<string>("");
    const [ userPlaceholder, setUserPlaceholder ] = useState<string>("");
    const [ error, setError ] = useState<string>("");

    useEffect(() => {
        const newUserNumberType = (userRole) === "Student" ? "Student No." : "Employee No.";
        setUserNumberType(newUserNumberType);
        setUserPlaceholder(`Enter your ${newUserNumberType}`);
    }, [userRole]);
    
    const router = useRouter();
    const numberRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const { setBaseUser } = useContext(UserContext);
    
    const validateUser = async () => {
        if(!(numberRef.current && passwordRef.current)){
            setError("Please fill all the required fields.");
            return;
        }
        
        const userNumber = numberRef.current.value;
        const password = passwordRef.current.value;
        if(!(userNumber.length > 0 && password.length > 0)){
            setError("Please fill all the required fields.");
            return;
        }

        const userNumberInt = parseInt(userNumber, 10);
        if (isNaN(userNumberInt)) {
            console.log("User number must be a valid number.");
            return;
        }

        switch (userRole) {
            case "Student":
            {
                const loginResponse = await api.user.loginStudent.query({ id: userNumberInt, password });

                if (!loginResponse || loginResponse.status === 'error') {
                    setError(loginResponse?.message || "Failed to login");
                } else if (loginResponse.status === 'ok') {
                    setError('');
                    setBaseUser({
                        type: 'student',
                        ...loginResponse.data,
                    } as StudentUser);
                    router.push("/user/student");
                }

                break;
            }
            case "Employee":
            {
                const loginResponse = await api.user.loginEmployee.query({ id: userNumberInt, password });

                if (!loginResponse || loginResponse.status === 'error') {
                    setError(loginResponse?.message || "Failed to login");
                } else if (loginResponse.status === 'ok') {
                    setError('');
                    setBaseUser({
                        type: 'employee',
                        ...loginResponse.data,
                    } as EmployeeUser);
                    router.push("/user/employee");
                }

                break;
            }
        }
    };
    
    return (
        <div className={`page ${sharedStyles.imageBackground}`}>
            <Nav />
            <main className="main">
                { showUserRole && (
                    <div className={sharedStyles.centeredDiv}>
                        <Logo width={250} height={28}/>
                        <p className="title17px">Logging Into an Account</p>
                        <hr />
                        
                        <p className="innerTitle">What are you logging in as?</p>
                        <div className={sharedStyles.colButtons}>
                            <UserRoleToggle userRole="Employee" setUseStates={ {setShow, setShowUserRole, setUserRole }}/>
                            <UserRoleToggle userRole="Student" setUseStates={ {setShow, setShowUserRole, setUserRole }}/>
                        </div>
                        
                        <LinkButton href="/register" className={sharedStyles.registerLoginLink}>
                            Don&apos;t have an account yet? Register here.
                        </LinkButton>
                    </div>
                )}
                { showLogin && (
                    <div className={sharedStyles.centeredDiv}>
                        <Logo width={250} height={28}/>
                        <p className="title17px">Logging in as {userRole}</p>
                        <hr />
                        
                        <div className={styles.container}>
                            <InputContent str={userNumberType} placeholder={userPlaceholder} type="text" ref={numberRef} />
                            <InputContent str="Password" placeholder="Enter your password" type="password" ref={passwordRef} />
                        </div>

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
                                onClick={validateUser}
                            >
                                Log In
                            </button>
                        </div>
                        
                        <LinkButton href="/register" className={sharedStyles.registerLoginLink}>
                            Don&apos;t have an account yet? Register here.
                        </LinkButton>
                    </div>
                )}
            </main>
        </div>
    );
}
