import React from "react";

export const ButtonBox: React.FC<{ buttonText: string; buttonOnClick: () => void; children?: React.ReactNode }> =
    ({buttonText, buttonOnClick, children}) => {
        return <div style={{
            backgroundColor: "#222",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            padding: 20,
            width: 300,
        }}>
            <div style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
            }}>
                <button onClick={buttonOnClick} style={{border: "none", padding: 10,}}>{buttonText}</button>
            </div>
            {
                children && <div style={{
                    alignItems: "center",
                    display: "flex",
                    flexDirection: "column",
                    gap: 5,
                }}>
                    {children}
                </div>
            }
        </div>;
    }
