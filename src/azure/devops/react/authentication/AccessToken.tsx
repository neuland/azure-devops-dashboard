import {
    InteractionRequiredAuthError,
    PublicClientApplication,
    RedirectRequest,
    SilentRequest
} from "@azure/msal-browser";
import {configuration} from "Configuration";
import {Configuration as MsalConfiguration} from "@azure/msal-browser/dist/config/Configuration";
import React, {useCallback, useContext, useEffect, useState} from "react";
import {MsalProvider, useIsAuthenticated, useMsal} from "@azure/msal-react";

const allScopesForTheAzureDevOpsApiResource = "499b84ac-1321-427f-aa17-267ca6975798/.default";
const loginRedirectConfiguration: RedirectRequest = {
    scopes: [
        allScopesForTheAzureDevOpsApiResource,
    ]
};
const msalConfiguration: MsalConfiguration = {
    auth: {
        ...configuration.authentication,
        navigateToLoginRequestUrl: false,
    },
    cache: {
        cacheLocation: "localStorage",
        storeAuthStateInCookie: false,
    }
}

const accessTokenTag = Symbol("AccessToken");
export type AccessToken = string & { readonly _tag: typeof accessTokenTag; }
const createAccessToken: (value: string) => AccessToken = (value) => value as AccessToken;

const accessTokenStateTagInitial = Symbol("accessTokenStateTagInitial");
const accessTokenStateTagLoggedOut = Symbol("accessTokenStateTagLoggedOut");
const accessTokenStateTagLoggingIn = Symbol("accessTokenStateTagLoggingIn");
const accessTokenStateTagLoggedIn = Symbol("accessTokenStateTagLoggedIn");
const accessTokenStateTagFetching = Symbol("accessTokenStateTagFetching");
const accessTokenStateTagAvailable = Symbol("accessTokenStateTagAvailable");

interface AccessTokenStateInitial {
    readonly _tag: typeof accessTokenStateTagInitial;
}

interface AccessTokenStateLoggedOut {
    readonly setAccessTokenState: (accessTokenState: AccessTokenState) => void;
    readonly _tag: typeof accessTokenStateTagLoggedOut;
}

interface AccessTokenStateLoggingIn {
    readonly setAccessTokenState: (accessTokenState: AccessTokenState) => void;
    readonly _tag: typeof accessTokenStateTagLoggingIn;
}

interface AccessTokenStateLoggedIn {
    readonly setAccessTokenState: (accessTokenState: AccessTokenState) => void;
    readonly _tag: typeof accessTokenStateTagLoggedIn;
}

interface AccessTokenStateFetching {
    readonly setAccessTokenState: (accessTokenState: AccessTokenState) => void;
    readonly _tag: typeof accessTokenStateTagFetching;
}

interface AccessTokenStateAvailable {
    readonly accessToken: AccessToken;
    readonly setAccessTokenState: (accessTokenState: AccessTokenState) => void;
    readonly _tag: typeof accessTokenStateTagAvailable;
}

type AccessTokenStateNonInitial =
    AccessTokenStateLoggedOut
    | AccessTokenStateLoggingIn
    | AccessTokenStateLoggedIn
    | AccessTokenStateFetching
    | AccessTokenStateAvailable;

type AccessTokenState =
    AccessTokenStateInitial
    | AccessTokenStateNonInitial;

const initialAccessTokenState: AccessTokenStateInitial = {
    _tag: accessTokenStateTagInitial,
};

const msalInstance = new PublicClientApplication(msalConfiguration);
const AccessTokenContext = React.createContext<AccessTokenState>(initialAccessTokenState);

export const AccessTokenProvider: React.FC<{ children?: React.ReactNode }> =
    ({children}) => {
        const [accessTokenState, setAccessTokenState] = useState<AccessTokenState>(initialAccessTokenState);

        const accessTokenStateNonInitial: AccessTokenStateNonInitial =
            accessTokenState._tag === accessTokenStateTagInitial
                ? {
                    setAccessTokenState,
                    _tag: accessTokenStateTagLoggedOut,
                }
                : accessTokenState;

        return <MsalProvider instance={msalInstance}>
            <AccessTokenContext.Provider value={accessTokenStateNonInitial}>{children}</AccessTokenContext.Provider>
        </MsalProvider>;
    };

export const accessTokenControlsTagLoggedOut = Symbol("accessTokenControlsTagLoggedOut");
export const accessTokenControlsTagLoggingIn = Symbol("accessTokenControlsTagLoggingIn");
export const accessTokenControlsTagLoggedIn = Symbol("accessTokenControlsTagLoggedIn");
export const accessTokenControlsTagFetching = Symbol("accessTokenControlsTagFetching");
export const accessTokenControlsTagAvailable = Symbol("accessTokenControlsTagAvailable");

export interface AccessTokenControlsLoggedOut {
    readonly triggerLoginRedirect: () => Promise<void>;
    readonly _tag: typeof accessTokenControlsTagLoggedOut;
}

export interface AccessTokenControlsLoggingIn {
    readonly triggerLogoutRedirect: () => Promise<void>;
    readonly _tag: typeof accessTokenControlsTagLoggingIn;
}

export interface AccessTokenControlsLoggedIn {
    readonly triggerLogoutRedirect: () => Promise<void>;
    readonly triggerFetchOrRedirectAccessToken: () => Promise<void>;
    readonly _tag: typeof accessTokenControlsTagLoggedIn;
}

export interface AccessTokenControlsFetching {
    readonly triggerLogoutRedirect: () => Promise<void>;
    readonly _tag: typeof accessTokenControlsTagFetching;
}

export interface AccessTokenControlsAvailable {
    readonly triggerLogoutRedirect: () => Promise<void>;
    readonly accessToken: AccessToken;
    readonly _tag: typeof accessTokenControlsTagAvailable;
}

export type AccessTokenControls =
    AccessTokenControlsLoggedOut
    | AccessTokenControlsLoggingIn
    | AccessTokenControlsLoggedIn
    | AccessTokenControlsFetching
    | AccessTokenControlsAvailable;

export const useAccessTokenControls: (autoFetchOrRedirectToken: boolean) => AccessTokenControls =
    (autoFetchOrRedirectToken) => {
        const accessTokenState = useContext(AccessTokenContext);
        const {instance, accounts} = useMsal();
        const isAuthenticated = useIsAuthenticated();

        if (accessTokenState._tag === accessTokenStateTagInitial) {
            throw Error("No access token controls available. Is this hook used outside of an AccessTokenProvider?");
        }

        const triggerLoginRedirect: () => Promise<void> =
            useCallback(() => {
                accessTokenState.setAccessTokenState({
                    setAccessTokenState: accessTokenState.setAccessTokenState,
                    _tag: accessTokenStateTagLoggingIn,
                });
                return instance.loginRedirect(loginRedirectConfiguration);
            }, [accessTokenState, instance]);

        const triggerLogoutRedirect: () => Promise<void> =
            useCallback(() => {
                return instance.logoutRedirect();
            }, [instance]);

        const triggerFetchOrRedirectAccessToken: () => Promise<void> =
            useCallback(() => {
                accessTokenState.setAccessTokenState({
                    setAccessTokenState: accessTokenState.setAccessTokenState,
                    _tag: accessTokenStateTagFetching,
                });
                const acquireTokenSilentConfiguration: SilentRequest = {
                    ...loginRedirectConfiguration,
                    account: accounts[0],
                }
                return instance.acquireTokenSilent(acquireTokenSilentConfiguration).then(response => {
                    const accessToken = createAccessToken(response.accessToken);
                    accessTokenState.setAccessTokenState({
                        accessToken,
                        setAccessTokenState: accessTokenState.setAccessTokenState,
                        _tag: accessTokenStateTagAvailable,
                    });
                }).catch(error => {
                    if (error instanceof InteractionRequiredAuthError) {
                        return instance.acquireTokenRedirect(acquireTokenSilentConfiguration);
                    } else {
                        throw error;
                    }
                });
            }, [accessTokenState, instance, accounts]);

        useEffect(() => {
            if (isAuthenticated && accounts?.length > 0 && accessTokenState._tag === accessTokenStateTagLoggedOut) {
                accessTokenState.setAccessTokenState({
                    setAccessTokenState: accessTokenState.setAccessTokenState,
                    _tag: accessTokenStateTagLoggedIn,
                });
            } else if (autoFetchOrRedirectToken && accessTokenState._tag === accessTokenStateTagLoggedIn) {
                triggerFetchOrRedirectAccessToken().catch(console.error);
            }
        }, [autoFetchOrRedirectToken, accessTokenState, accounts, isAuthenticated, triggerFetchOrRedirectAccessToken]);

        switch (accessTokenState._tag) {
            case accessTokenStateTagLoggedOut:
                const accessTokenControlsEmpty: AccessTokenControlsLoggedOut = {
                    triggerLoginRedirect,
                    _tag: accessTokenControlsTagLoggedOut,
                };
                return accessTokenControlsEmpty;

            case accessTokenStateTagLoggingIn:
                const accessTokenControlsLoggingIn: AccessTokenControlsLoggingIn = {
                    triggerLogoutRedirect,
                    _tag: accessTokenControlsTagLoggingIn,
                };
                return accessTokenControlsLoggingIn;

            case accessTokenStateTagLoggedIn:
                const accessTokenControlsLoggedIn: AccessTokenControlsLoggedIn = {
                    triggerLogoutRedirect,
                    triggerFetchOrRedirectAccessToken,
                    _tag: accessTokenControlsTagLoggedIn,
                };
                return accessTokenControlsLoggedIn;

            case accessTokenStateTagFetching:
                const accessTokenControlsFetching: AccessTokenControlsFetching = {
                    triggerLogoutRedirect,
                    _tag: accessTokenControlsTagFetching,
                };
                return accessTokenControlsFetching;

            case accessTokenStateTagAvailable:
                const accessTokenControlsAvailable: AccessTokenControlsAvailable = {
                    triggerLogoutRedirect,
                    accessToken: accessTokenState.accessToken,
                    _tag: accessTokenControlsTagAvailable,
                };
                return accessTokenControlsAvailable;
        }
    };

export const useAccessToken: () => { accessToken: AccessToken; } =
    () => {
        const accessTokenState = useContext(AccessTokenContext);

        if (accessTokenState._tag === accessTokenStateTagAvailable) {
            return {
                accessToken: accessTokenState.accessToken,
            };
        }

        throw Error("No access token available. Is this hook used outside of an AccessTokenProvider or without checking the state in useAccessTokenControls?");
    };
