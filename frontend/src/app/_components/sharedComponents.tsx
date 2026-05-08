import type { Ref } from "react";

type InputContentProps = {
    str: string;
    placeholder: string;
    type: string;
    ref: Ref<HTMLInputElement>;
};

export type UserRole = "" | "Employee" | "Student";

export function InputContent({ str, placeholder, type, ref }: InputContentProps){
    return (
      <div>
          <label>{str}</label>

          <input 
              placeholder={placeholder} 
              ref={ref}
              type={type}
          />
      </div>
    );
}

type AppState = {
    setShow: React.Dispatch<React.SetStateAction<boolean>>;
    setShowUserRole: React.Dispatch<React.SetStateAction<boolean>>;
    setUserRole: React.Dispatch<React.SetStateAction<UserRole>>;
};

export function UserRoleToggle({ userRole, setUseStates }: { userRole: UserRole, setUseStates: AppState}) {
    return (
        <button 
            className="primaryButton"
            onClick={ () => {
                setUseStates.setShow(true);
                setUseStates.setShowUserRole(false);
                setUseStates.setUserRole(userRole);
            }}
            rel="noopener noreferrer"
        >
            {userRole}
        </button>
    );
}


