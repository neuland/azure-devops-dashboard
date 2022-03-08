import React from "react";

export const FullscreenCenter: React.FC =
    ({children}) => {
        return <div style={{
            alignItems: "center",
            display: "flex",
            flexDirection: "column",
            gap: 50,
            height: "100vh",
            justifyContent: "center",
            width: "100vw",
        }}>{children}</div>;
    }
