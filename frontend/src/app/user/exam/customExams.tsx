import type { Question } from "../employee/createExam/customExams";

type GeneratedExamProps = {
    question: Question;
    index: number;
}

export function RenderGeneratedInputExam({question, index}:GeneratedExamProps) {
    const height = (question.type === "Paragraph") ? 200 : 20;
    return(
        <div 
            key={question.id}
            style={{display: "flex", gap: "10px", flexDirection: "column", width: "100%"}}
        >
            <p>{index+1}. {question.question}</p>
            <textarea
                placeholder="Enter your answer."
                style={{width: "100%", height: `${height}px`}}
            />
        </div>
    );
}

export function RenderGeneratedFileExam({question, index}:GeneratedExamProps) {
    return(
        <div 
            key={question.id}
            style={{display: "flex", gap: "10px", flexDirection: "column", width: "100%"}}
        >
            <p>{index+1}. {question.question}</p>
            <button style={{margin: "0 10%", width: "80%", height: "300px", fontSize: "20px", cursor: "pointer"}}>
                Drop File Here or Browse Local Device
            </button>
        </div>
    );
}

export function RenderGeneratedOptionExam({question, index}:GeneratedExamProps) {
    if(!("options" in question)) return <p>Invalid question type</p>;

    const options = question.options;
    let inputType = (question.type === "Multiple Choice") ? "radio" : "checkbox";
    return(
        <div 
            key={question.id}
            style={{display: "flex", gap: "10px", flexDirection: "column", width: "100%"}}
        >
            <p>{index+1}. {question.question}</p>
            {   
                options.map(opt => (
                    <label key={opt} style={{display: "flex", gap: "5px"}}>
                        <input 
                            value={opt}
                            type={inputType}
                        />
                        {opt}
                    </label>
                ))
            }
        </div>
    );
}