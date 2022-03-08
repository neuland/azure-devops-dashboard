import React from "react";

export const Box: React.FC =
    ({children}) => {
        return <div style={{
            backgroundColor: "#222",
            padding: 20,
        }}>{children}</div>;
    }
