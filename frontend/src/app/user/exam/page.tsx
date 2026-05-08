"use client";

import styles from "./page.module.css";
import sharedStyles from "~/app/user/components/shared.module.css";
import Nav from "~/app/user/components/userNav";
import { useContext, useState } from "react";
import { UserContext } from "~/app/UserContext";
import type { Question } from "../employee/createExam/customExams";
import { RenderGeneratedFileExam, RenderGeneratedInputExam, RenderGeneratedOptionExam } from "./customExams";
import { LinkButton } from "~/app/_components/links";

export default function GenerateExam() {
    const { baseUser } = useContext(UserContext);
    const [ currentPage, setCurrentPage ] = useState<number>(0);
    const [ isStartDisabled, setIsStartDisabled ] = useState<boolean>(false);
    const [ isEndDisabled, setIsEndDisabled ] = useState<boolean>(false);
    const [ noOfPages ] = useState<number>(1);
    
    if (!baseUser) return <p>No user is logged in</p>;
    const generatedExamRaw  = localStorage.getItem("generatedExam");
    if(!generatedExamRaw) return <p>generatedExamRaw is null</p>

    const {
        examID, 
        employeeID, 
        examTitle, 
        examType, 
        course, 
        sections, 
        pageDescriptions,
        dueDate, 
        cutOffDate,
        releaseDate,
        examQuestions,
    } = JSON.parse(generatedExamRaw) as {
        examID: string;
        employeeID: string;
        examTitle: string;
        examType: string;
        course: string;
        sections: string[];
        pageDescriptions: string[];
        dueDate: string;
        cutOffDate: string;
        releaseDate: string;
        examQuestions: Question[][];
    };

    let sectionFormatted = "";
    sections.forEach((section:string, i:number) => {
        console.log(section);
        sectionFormatted += (section + ((i === sections.length-1) ? "" : ", "));
    });
    console.log(sectionFormatted);

    const navigatePage = (direction: number) => {
        if((direction === -1 && currentPage === 0) || (direction === 1 && currentPage === examQuestions.length-1)) return;
        const newPage = currentPage + direction;
        setCurrentPage(newPage);

        setIsStartDisabled((newPage <= 0));
        setIsEndDisabled((newPage >= noOfPages));
    }   

    return (
        <div className={sharedStyles.page}>
            <Nav scope="employee" />

            <main className={`${sharedStyles.main} ${styles.main} main `}>
                <div 
                    className={sharedStyles.examCourseDiv}
                    style={{display: "flex", flexDirection: "column", gap: "10px"}}
                >
                    <p className="title22px">Exam Title: {examTitle}</p>
                    <p className="title17px">Sections: {sectionFormatted}</p>
                    <p className="title17px">Exam Type: {examType}</p>
                    <p>Due Date: {dueDate}</p>
                    <p>Cut-Off Date: {cutOffDate}</p>
                    <p>Release Date: {(releaseDate === "") ? "Manual Release" : releaseDate}</p>
                    <div style={{display: "flex", justifyContent: "space-between"}}>
                        <LinkButton href="employee/createExam" className="primaryButton">
                            Go Back
                        </LinkButton>
                        <LinkButton href="/employee/createExam" className="primaryButton">
                            Save Exam
                        </LinkButton>
                    </div>
                    
                </div>
                <div className={sharedStyles.examCourseDiv}>
                    <p className="title17px">Page {currentPage+1}</p>
                    <div style={{display: "flex", justifyContent: "space-between", margin: "10px 0px"}}>
                        <button 
                            onClick={ () => navigatePage(-1) }
                            className="secondaryButton"
                            disabled={isStartDisabled}
                        >Previous Page</button>
                        <button 
                            onClick={ () => navigatePage(1) }
                            className="secondaryButton"
                            disabled={isEndDisabled}
                        >Next Page</button>
                    </div>
                    <div style={{display: "flex", gap: "15px", flexDirection: "column"}}>
                        {
                            (pageDescriptions.length > 0) && (
                                <p>Description: {pageDescriptions[currentPage]}</p>
                            )
                        }
                        { examQuestions[currentPage]?.map((question:Question, index:number) => {
                            console.log(question);
                            switch(question.type){
                                case "File Submission":
                                    console.log("OH");
                                    return( <RenderGeneratedFileExam question={question} index={index}/>);
                                case "Paragraph":
                                case "Short Answer":
                                    console.log("OH");
                                    return( <RenderGeneratedInputExam question={question} index={index}/>);
                                case "Checkbox":
                                case "Multiple Choice":
                                    console.log("E");
                                    return( <RenderGeneratedOptionExam question={question} index={index}/>);
                            }
                        })}
                    </div>
                </div>
            </main>
        </div>
    );
} 
