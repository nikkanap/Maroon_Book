"use client"
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { RenderDescription, RenderFileSubmissionQuestion, RenderInputQuestion, RenderOptionQuestion, type InputQuestion, type Question, } from "./customExams";

type GeneralExamProps = {
    questionObjs:Question[][];
    setQuestionObjs:Dispatch<SetStateAction<Question[][]>>;
}

export function RenderFileSubmission({questionObjs, setQuestionObjs}: GeneralExamProps) {
    if(!questionObjs?.[0]?.[0]) return <p>questionObjs is undefined.</p>;
    return (
        <>
            <p className="title22px">File Submission</p>
            <RenderFileSubmissionQuestion 
                questionType={"File Submission"} 
                questionId={questionObjs[0][0].id} 
                questionObj={questionObjs[0][0]}
                setQuestionObjs={setQuestionObjs} 
                currentPage={0} 
            />
        </>
    );
}

export function RenderEssay({questionObjs, setQuestionObjs}: GeneralExamProps) {
    if(!questionObjs?.[0]?.[0]) return <p>questionObjs is undefined.</p>;
    return (
        <>
            <p className="title22px">Essay Question</p>
            <RenderInputQuestion 
                questionType={"Paragraph"}
                questionId={questionObjs[0][0].id} 
                questionObj={questionObjs[0][0]}
                setQuestionObjs={setQuestionObjs} 
                currentPage={0} 
            />
        </>
    );
}

type CustomExamProps = {
    pageDescriptions: string[];
    setPageDescriptions:Dispatch<SetStateAction<string[]>>;
    questionObjs:Question[][];
    setQuestionObjs:Dispatch<SetStateAction<Question[][]>>;
}

export function RenderCustomExam({pageDescriptions, setPageDescriptions, questionObjs, setQuestionObjs}: CustomExamProps) {
    // Assume single page for now - commenting out multi-page functionality
    const [ currentPage, setCurrentPage ] = useState<number>(0);
    // const [ pages, setPages ] = useState<number>(1);
    // const [ isStartDisabled, setIsStartDisabled ] = useState<boolean>(true);
    // const [ isEndDisabled, setIsEndDisabled ] = useState<boolean>(true);
    
    // const [ count, setCount ] = useState<number>(0);

    // useEffect(() => {
    //     setIsStartDisabled(currentPage <= 0);
    //     setIsEndDisabled(currentPage >= pages-1);
    //     console.log(`[USEFFECT from change in pages and currentPages] pages = ${pages}, currentPage = ${currentPage}`)
    // }, [pages, currentPage]);

    useEffect(() => {
        console.log(questionObjs);
    }, [questionObjs]);

    // useEffect(() => {
    //     setCount(count+1);
    //     console.log("" + count+1);
    // }, []);    

    const addQuestion = () => {
        setQuestionObjs((prev:Question[][])=> {
            const newPages = [...prev];
            newPages[currentPage] = [
                ...newPages[currentPage] ?? [],
                { 
                    type: "Short Answer", 
                    id: crypto.randomUUID(),
                    question: "",
                    wordLimit: null 
                }
            ]
            return newPages;
        });
        console.log(`[Adding new question to page ${currentPage+1}]`);
    };

    const updateQuestionType = (value: string, oldId: string, index: number) => {
        const updated = [...questionObjs];
        if(!updated[currentPage]) return;

        console.log("Updating question type");

        const pageQuestions = [...updated[currentPage]];
        const oldQuestion = pageQuestions[index];
        if(!oldQuestion) return;

        let newQuestion: Question;
        const questionId = crypto.randomUUID();
        if(value === "Short Answer" || value === "Paragraph") {
            newQuestion = { 
                type: value, 
                id: questionId,
                question: "",
                wordLimit: (value === "Short Answer") ? null : 300 
            };
        } else if(value === "Multiple Choice") {
            newQuestion = { 
                type: value, 
                id: questionId,
                question: "",
                options: []
            };
        } else {
            newQuestion = { 
                type: value, 
                id: questionId,
                question: "",
                maxNoOfSubmissions: 3,
                maxFileSize: "",
                fileSubmissionTypes: [
                    {
                        value: "All Files",
                        label: "All Files"
                    }
                ]
            };
        }

        setQuestionObjs((prev: Question[][]) => {
            const newQuestionObjs = [...prev];
            const pageQuestions = [...(prev[currentPage] ?? [])];

            const index = pageQuestions.findIndex(q => q.id === oldId);

            pageQuestions[index] = newQuestion;
            newQuestionObjs[currentPage] = pageQuestions;
            return newQuestionObjs;
        });     
    }

    const removeQuestion = (index: number) => {
        setQuestionObjs((prev:Question[][]) => prev.filter((_, i) => i !== index));
    };

    const moveQuestion = (direction: number, index: number) => {
        const newQuestionObjs = [...questionObjs];
        if(!newQuestionObjs[currentPage]) return; 

        const toIndex = index + direction;
        if(toIndex < 0 || toIndex >= newQuestionObjs.length) return;
        const [movedItem] = newQuestionObjs[currentPage].splice(index, 1);

        if(!movedItem) return;
        newQuestionObjs[currentPage].splice(toIndex, 0, movedItem);
        setQuestionObjs(newQuestionObjs);
    };

    // Multi-page functionality commented out - assuming single page for now
    // const addNewPage = () => {
    //     console.log("[Adding a new page]");
    //     setCurrentPage(currentPage+1);
    //     setPages(pages+1);
    //     setPageDescriptions((prev:string[])=> {
    //         const newPageDescriptions = [...prev];
    //         newPageDescriptions.splice(currentPage, 0, "Enter a description.");
    //         return newPageDescriptions;
    //     })

    //     setQuestionObjs((prev:Question[][]) => {
    //         let newPages = [...prev];
    //         const newQuestionArray = [{ 
    //             type: "Short Answer", 
    //             id: crypto.randomUUID(),
    //             question: "",
    //             wordLimit: null  
    //         }];

    //         if(!newPages[currentPage+1]) newPages[currentPage+1] = newQuestionArray;
    //         else newPages.splice(currentPage+1, 0, newQuestionArray);
    //         return newPages;
    //     });
    // }

    // const removePage = () => {
    //     console.log(`[Removing pages ${currentPage}]`);
    //     setCurrentPage((pages-1 > currentPage || currentPage === 0) ? currentPage : currentPage-1);
    //     setPages(pages-1);
    //     setPageDescriptions((prev:string[])=> {
    //         const newPageDescriptions = [...prev];
    //         newPageDescriptions.splice(currentPage, 1);
    //         return newPageDescriptions;
    //     });
    //     setQuestionObjs((prev:Question[][]) => {
    //         const newPages = [...prev];
    //         newPages.splice(currentPage, 1);
    //         return newPages;
    //     });
    // }

    // const navigatePage = (direction: number) => {
    //     setCurrentPage(currentPage + direction);
    // }   

    // const movePage = (direction: number) => {
    //     setQuestionObjs((prev:Question[][]) => {
    //         const newQuestionObjs = [...prev];
            
    //         const [ item ] = newQuestionObjs.splice(currentPage, 1);
    //         if(!item) return prev;

    //         newQuestionObjs.splice(currentPage+direction, 0, item);

    //         return newQuestionObjs;
    //     });

    //     setCurrentPage(currentPage+direction);
    // }

    return (
        <>
            <p className="title22px">Custom Exam</p>
            {/* Multi-page functionality commented out - assuming single page for now */}
            {/* <p className="title17px">Page {currentPage+1}</p> */}
            {/* <div style={{display: "flex", justifyContent: "space-between", margin: "10px 0px"}}>
                <button 
                    onClick={() => addNewPage()}
                    className="secondaryButton"
                >Add A New Page
                </button>
                <button 
                    onClick={() => removePage()}
                    className="secondaryButton"
                    disabled={isStartDisabled}
                >Remove Page</button>
            </div> */}
            
            {/* <div style={{display: "flex", justifyContent: "space-between", margin: "10px 0px"}}>
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
                <button 
                    onClick={ () => movePage(1) }
                    className="secondaryButton"
                    disabled={isEndDisabled}
                >Move Page Up</button>
                <button 
                    onClick={ () => movePage(-1) }
                    className="secondaryButton"
                    disabled={isStartDisabled}
                >Move Page Down</button>
            </div> */}

            {/* Page description functionality commented out - assuming single page for now */}
            {/* <RenderDescription descriptions={pageDescriptions} setDescriptions={setPageDescriptions} currentPage={currentPage} /> */}

            <div style={{width: "100%"}}>
                <button
                    className="primaryButton"
                    style={{ margin: "10px 0px"}}
                    onClick={ () => addQuestion() }
                >Add Question</button>
            </div>

            <p className="title17px" style={{textAlign: "center"}}>QUESTION</p>

            <div>
                { questionObjs[currentPage]?.map((questionObj:Question, index:number) => {
                    const questionType = questionObj.type;
                    const questionId = questionObj.id;
                    if(!questionType || !questionId) return (<p key={questionId}>Question type is null</p>);
                    console.log(questionObjs[currentPage]?.length);

                    return (
                        <div 
                            key={questionId} 
                            style={{ 
                                margin: "10px 0px", 
                                border: "1px solid black", 
                                borderRadius: "10px", 
                                padding: "15px"
                            }}
                        >
                            <div 
                                style={{ 
                                    width: "100%", 
                                    display: "grid", 
                                    gridTemplateColumns: "1fr 1fr 7fr 1fr 1fr", 
                                    marginBottom: "10px", 
                                    textAlign: "right"
                                }}>
                                <button
                                    className="secondaryButton" 
                                    onClick={() => moveQuestion(-1, index)}>
                                    Move Up
                                </button>

                                <button
                                    className="secondaryButton" 
                                    onClick={() => moveQuestion(1, index)}>
                                    Move Down
                                </button>

                                <label>                        
                                    Question Type
                                    <select
                                        value={questionType}
                                        onChange={e => updateQuestionType(e.target.value, questionId, index) }
                                    >
                                        <option value="Short Answer">Short Answer</option>
                                        <option value="Paragraph">Paragraph</option>
                                        <option value="Multiple Choice">Multiple Choice</option>
                                        {/* <option value="File Submission">File Submission</option> */}
                                    </select>
                                </label>
                                <p></p>
                                <button
                                    className="secondaryButton" 
                                    onClick={() => removeQuestion(index)}>
                                    Remove Question
                                </button>
                            </div>
                                    
                            { (questionType === "Short Answer" || questionType === "Paragraph") && 
                                (<RenderInputQuestion 
                                    questionType={questionType}
                                    questionId={questionId}
                                    questionObj={questionObj}
                                    setQuestionObjs={setQuestionObjs} 
                                    currentPage={currentPage}
                                />) }

                            { (questionType === "Multiple Choice") && 
                                (<RenderOptionQuestion 
                                    questionType={questionType}
                                    questionId={questionId}
                                    questionObj={questionObj}
                                    setQuestionObjs={setQuestionObjs} 
                                    currentPage={currentPage} 
                                />) }

                            { (questionType === "File Submission") && 
                                (<RenderFileSubmissionQuestion 
                                    questionType={questionType}
                                    questionId={questionId}
                                    questionObj={questionObj}
                                    setQuestionObjs={setQuestionObjs} 
                                    currentPage={currentPage}
                                />) }
                        </div>
                    );
                }
                )}
            </div>
        </>
    )
}