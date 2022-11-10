import React from "react";

export const Box: React.FC<{ children?: React.ReactNode}> =
    ({children}) => {
        return <div style={{
            backgroundColor: "#222",
            padding: 20,
        }}>{children}</div>;
    }
