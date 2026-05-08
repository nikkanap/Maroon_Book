import { useEffect, useState } from "react";
import styles from "./page.module.css";

export type InputQuestion = {
    type: string|null;
    id: string|null;
    question: string;
    wordLimit: number|null;
};

export type OptionQuestion = {
    type: string|null;
    id: string|null;
    question: string;
    options: string[];
};

export type FileSubmissionQuestion = {
    type: string|null;
    id: string|null;
    question: string;
    maxNoOfSubmissions: number;
    maxFileSize: string;
    fileSubmissionTypes: {
        value: string;
        label: string;
    }[];
};

export type Question = InputQuestion | OptionQuestion | FileSubmissionQuestion;

type QuestionProps = {
    questionType: string|null;
    questionId: string|null;
    questionObj: Question;
    setQuestionObjs: React.Dispatch<React.SetStateAction<Question[][]>>|undefined;
    currentPage: number;
}

export function RenderOptionQuestion({questionType, questionId, questionObj, setQuestionObjs, currentPage}:QuestionProps) {
    if(!("options" in questionObj)) return <p>questionObj is invalid</p>;

    const initQuestionObj = questionObj as OptionQuestion ?? {
        type: questionType,
        id: questionId,
        question: "Enter a question.",
        options: []
    };

    const [ options, setOptions ] = useState<string[]>(initQuestionObj.options);
    const [ count, setCount ] = useState(1);
    const [ question, setQuestion ] = useState(initQuestionObj.question);
    const [ qo, setQuestionObj ] = useState<OptionQuestion>(initQuestionObj);

    if(!setQuestionObjs) return <p>setQuestionObjs Function is undefined</p>;

    useEffect(() => {
        setQuestionObj({
            ...qo,
            question: question,
            options
        });
    }, [ question, options ])

    useEffect(() => {
        if(!setQuestionObjs) return;

        setQuestionObjs((prev) => {
            const newQuestionObjs = [...prev];
            const pageQuestions = [...(prev[currentPage] ?? [])];
            
            const index = pageQuestions.findIndex(q => q.id === qo.id);

            if (index === -1) pageQuestions.push(qo);
            else pageQuestions[index] = qo;

            newQuestionObjs[currentPage] = pageQuestions;
            console.log(pageQuestions);
            return newQuestionObjs;
        });        
    }, [ qo ]);

    const optionType = (qo.type === "Multiple Choice") ? "𖧋" : "";

    const addNewOption = () => {
        setOptions(prev => [
            ...prev, ""
        ]);
        setCount(count + 1);
    };

    const removeOption = (index: number) => {
        setOptions(prev => prev.filter((_, i) => i !== index));
    };

    const updateOption = (index: number, value: string) => {
        const updated = [...options];
        updated[index] = value;
        setOptions(updated);
    }

    console.log("type: " + qo.type);

    return (
        <>
            {(qo.type != undefined) && (<p className="title17px">{qo.type.toUpperCase().replace("-", " ")}</p>)}
            
            <label style={{ display: "flex", flexDirection: "column", margin: "10px 0px"}}>
                Description/Question
                <textarea 
                    style={{height: "50px"}}
                    onChange={e => setQuestion(e.target.value)}
                    placeholder="Enter a question."
                    value={question}
                />
            </label>

            <div className={styles.options}>
                <p>Options</p>
                { options.map((opt, i) => (
                    <label key={i} style={{display: "flex", width: "100%", gap: "5px"}}>
                        {`${optionType} `} 
                        <input 
                            type="text" 
                            placeholder={`Option ${i+1}`}
                            value={opt}
                            onChange={e => updateOption(i, e.target.value)}
                            style={{ width: "70%"}}
                        />
                        <button onClick={() => removeOption(i)} style={{ 
                            fontSize: "10px",
                            fontWeight: "bold",
                            padding: "5px 10px",
                            borderRadius: "5px",
                            border: "1px solid transparent",
                            transition: "0.2s",
                            cursor: "pointer",
                            background: "#7B1113",
                            color: "#ffffff"
                        }}>
                            Remove
                        </button>
                    </label>
                ))}
                <button onClick={() => addNewOption()} className="secondaryButton">Add Option</button>
            </div>
        </>
    );
}

// goods
export function RenderInputQuestion({questionType, questionId, questionObj, setQuestionObjs, currentPage}:QuestionProps) {    
    if(!("wordLimit" in questionObj)) return <p>questionObj.type is invalid</p>

    const initQuestionObj = (questionObj as InputQuestion) ??
    {
        type: questionType,
        id: questionId,
        question: "Enter a question.",
        wordLimit: questionType === "paragraph" ? 300 : null,
    };

    const [ wordLimit, setWordLimit ] = useState(initQuestionObj.wordLimit);
    const [ question, setQuestion ] = useState<string>(initQuestionObj.question);
    const [ qo, setQuestionObj ] = useState<InputQuestion>(initQuestionObj);

    useEffect(() => {
        setQuestionObj({
            type: questionType,
            id: questionId,
            question,
            wordLimit
        });
    }, [question, wordLimit]);

    useEffect(() => {
        if(!setQuestionObjs) return;

        setQuestionObjs((prev:Question[][]) => {
            const newQuestionObjs = [...prev];
            const pageQuestions = [...(prev[currentPage] ?? [])];
            
            const index = pageQuestions.findIndex(q => q.id === qo.id);

            if (index === -1) pageQuestions.push(qo);
            else pageQuestions[index] = qo;

            newQuestionObjs[currentPage] = pageQuestions;
            return newQuestionObjs;
        });        
    }, [qo]);

    return(
        <>
            { (questionType) && (<p className="title17px">{questionType.toUpperCase().replace("-", " ")}</p>) }
            <label style={{display: "flex", flexDirection: "column", margin: "10px 0px"}}>
                Description/Question
                <textarea 
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                    placeholder="Enter a question."
                />
            </label>

            { (questionType === "Paragraph") && (
                <label style={{display: "flex", flexDirection: "row", gap: "10px"}}>
                    Set Word Limit
                    <input 
                        type="number"
                        value={`${wordLimit}`}
                        placeholder="Enter a word limit."
                        onChange={e => setWordLimit(Number(e.target.value))}
                    />
                </label>
            )}
            
        </>
    );
}

export const BASE_FILE_OPTIONS = [
    { value: "All Files", label: "All Files" },
    { value: "Documents", label: "Documents (.pdf, .doc, .docx, .txt, .rtf, .odt)" },
    { value: "Spreadsheets", label: "Spreadsheets (.xls, .xlsx, .csv, .ods)" },
    { value: "Presentations", label: "Presentations (.ppt, .pptx, .odp)" },
    { value: "Image Files", label: "Image Files (.png, .jpg/.jpeg, .gif, .bmp, .tiff/.tif, .webp)" },
    { value: "Video Files", label: "Video Files (.mp4, .mov, .avi, .wmv, .mkv)" },
    { value: "Audio Files", label: "Audio Files (.mp3, .wav, .m4a, .ogg)" },
    { value: "Code Files", label: "Code Files (.java, .py, .cpp, .c, .js, .ts, .html, .css, .php, .xml, .json, .ipynb, .sql)" },
    { value: "Compressed Archives", label: "Compressed Archives (.zip, .rar, .7z, .tar.gz)" }
];

export function RenderFileSubmissionQuestion({questionType, questionId, questionObj, setQuestionObjs, currentPage}:QuestionProps) {  
    const invalid = !(
        "maxNoOfSubmissions" in questionObj 
        && "maxFileSize" in questionObj 
        && "fileSubmissionTypes" in questionObj);
    if(invalid) return <p>questionObj.type is invalid</p>
    
    const initQuestionObj = (questionObj as FileSubmissionQuestion) ??
    {
        type: questionType,
        id: questionId,
        question: "Enter a question",
        maxNoOfSubmissions: 3,
        maxFileSize: "100 MB",
        fileSubmissionTypes: [{
            value: "All Files",
            label: "All Files"
        }]
    };

    const [ question, setQuestion ] = useState<string>(initQuestionObj.question);
    const [ maxNoOfSubmissions,  setMaxNoOfSubmissions ] = useState<number>(initQuestionObj.maxNoOfSubmissions);
    const [ maxFileSize, setMaxFileSize ] = useState<string>(initQuestionObj.maxFileSize);
    const [ customFile, setCustomFile ] = useState<string>("");
    const [ fileSubmissionTypes, setFileSubmissionTypes ] = useState<{value:string, label:string}[]>(initQuestionObj.fileSubmissionTypes);

    const [ isChecked, setIsChecked ] = useState<boolean>(true);
    const [ checkedAllFiles, setCheckedAllFiles ] = useState<boolean>(true);
    const [ qo, setQuestionObj ] = useState<FileSubmissionQuestion>(initQuestionObj);
    
    const optionFiles = [...BASE_FILE_OPTIONS, { value: customFile, label: "Custom File" }];

    useEffect(() => {
        setIsChecked(fileSubmissionTypes.some(item => item.label === "Custom File" || item.value === "All Files") );
        setCheckedAllFiles(fileSubmissionTypes.some(type => type.value === "All Files"));
    }, [fileSubmissionTypes])

    useEffect(() => {
        setQuestionObj({
            type: questionType,
            id: questionId,
            question,
            maxNoOfSubmissions,
            maxFileSize,
            fileSubmissionTypes,
        });
    }, [question, maxNoOfSubmissions, maxFileSize, fileSubmissionTypes]);

    useEffect(() => {
        if(!setQuestionObjs) return;

        setQuestionObjs((prev:Question[][]) => {
            const newQuestionObjs = [...prev];
            const pageQuestions = [...(prev[currentPage] ?? [])];
            
            const index = pageQuestions.findIndex(q => q.id === qo.id);

            if (index === -1) pageQuestions.push(qo);
            else pageQuestions[index] = qo;

            newQuestionObjs[currentPage] = pageQuestions;
            return newQuestionObjs;
        });        
    }, [qo]);

    const handleCheck = (value: string, label: string) => {
        setFileSubmissionTypes(prev => {
            // check if already exists
            const exists = prev.some(item => item.label === label);
            console.log(`${label} exists`);

            if (exists) {
                console.log(`removing ${label}`);
                return prev.filter(item => item.value !== value);
            }

            if (value === "All Files") {
                return [{ value, label }];
            }
            
            const filtered = prev.filter(item => item.value !== "All Files");
            return [...filtered, { value, label }];
        });
    };

    const RenderFileTypes = () => {
        return (
        <div>
            { optionFiles.map(opt => {
                return (
                <label key={opt.value} style={{ display: "block", marginBottom: "5px" }}>
                <input
                    type="checkbox"
                    checked={ fileSubmissionTypes.some(type => type.label === opt.label) || checkedAllFiles }
                    onChange={ () => handleCheck(opt.value, opt.label) }
                />
                {opt.label}
                </label>
            )}) }
            
            { isChecked  && (
                <label>
                Custom File Type:
                    <input 
                        type="text" 
                        onChange={e => setCustomFile(e.target.value)}
                    />
                </label>
            )}
            </div>
        );
    }

    return (
        <>
            <p className="title17px">FILE SUBMISSION</p>
            <label>
                Description/Question
                <textarea 
                    value={ question }
                    onChange={e => setQuestion(e.target.value)}
                    placeholder="Enter a question."
                    style={{height: "75px", width: "100%"}}
                />
            </label>

            <label style={{display: "block", margin: "5px 0px"}}>
                Maximum number of files
                <select
                    value={ maxNoOfSubmissions }
                    onChange={e =>  setMaxNoOfSubmissions(Number(e.target.value))}
                >
                    <option value="1">1</option>
                    <option value="3">3</option>
                    <option value="5">5</option>
                    <option value="10">10</option>
                </select>
            </label>

            <label style={{display: "block", margin: "5px 0px"}}>
                Maximum file size
                <select
                    value={ maxFileSize }
                    onChange={e =>  setMaxFileSize(e.target.value)}
                >
                    <option value="1 MB">1 MB</option>
                    <option value="10 MB">10 MB</option>
                    <option value="100 MB">100 MB</option>
                    <option value="1 GB">1 GB</option>
                    <option value="10 GB">10 GB</option>
                </select>
            </label>

            <p>File Types</p>
            <RenderFileTypes />
        </>
    )
}

type DescProps = {
descriptions:string[];
setDescriptions:Function;
currentPage:number;
}

export function RenderDescription({descriptions, setDescriptions, currentPage}: DescProps) {
    const updateDescription = (value: string) => {
        let newDescriptions = [...descriptions];
        newDescriptions[currentPage] = value;
        setDescriptions(newDescriptions);
    } 

    return (
        <label style={{ display: "flex", flexDirection: "column"}}>
            Page Description
            <textarea 
                value={descriptions[currentPage]}
                onChange={e => updateDescription(e.target.value)}
                placeholder="Enter a page description."
                style={{ height: "100px"}}
            />
        </label>
    );
}

