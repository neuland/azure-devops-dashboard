export interface Configuration {
    authentication: {
        clientId: string;
        authority: string;
        redirectUri: string;
    };
}

if (process.env.NODE_ENV !== 'production') {
    // @ts-ignore
    document.configuration = {
        authentication: {
            clientId: process.env.REACT_APP_AUTH_CLIENT_ID ?? "",
            authority: process.env.REACT_APP_AUTH_AUTHORITY ?? "",
            redirectUri: process.env.REACT_APP_AUTH_REDIRECT_URI ?? "",
        },
    };
}

// @ts-ignore
export const configuration: Configuration = document.configuration
