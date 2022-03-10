import React, {useCallback, useEffect, useState} from 'react';
import {
    accessTokenControlsTagAvailable,
    accessTokenControlsTagFetching,
    accessTokenControlsTagLoggedIn,
    accessTokenControlsTagLoggedOut,
    accessTokenControlsTagLoggingIn,
    useAccessToken,
    useAccessTokenControls
} from "azure/devops/react/authentication/AccessToken";
import {FullscreenCenter} from "./component/layout/FullscreenCenter";
import {ButtonBox} from "./component/layout/ButtonBox";
import {Approval, Data, fetchData} from "./Data";
import {Box} from "./component/layout/Box";

const IntroBox: React.FC<{ triggerLogoutRedirect: () => Promise<void>; }> =
    ({triggerLogoutRedirect}) => {
        return <ButtonBox buttonText={"Logout"} buttonOnClick={() => triggerLogoutRedirect().catch(console.error)}>
            <p>Azure DevOps Dashboard</p>
            <p><a href="https://github.com/neuland/azure-devops-dashboard"
                  rel="noreferrer"
                  target="_blank">GitHub Project</a></p>
        </ButtonBox>;
    };

const PendingApprovalsBox: React.FC<{ pendingApprovals: ReadonlyArray<Approval>; }> =
    ({pendingApprovals}) => {
        return <Box>
            <table>
                <caption>Pending Approvals</caption>
                <thead>
                <tr>
                    <th>Organization</th>
                    <th>Project</th>
                    <th>Pipeline</th>
                    <th>Build</th>
                    <th>Stage</th>
                    <th>Action</th>
                </tr>
                </thead>
                <tbody>{
                    pendingApprovals.length > 0
                        ? pendingApprovals.map((pendingApproval, index) => {
                            const href = `https://dev.azure.com/${pendingApproval.organizationName}/${pendingApproval.projectName}/_build/results?buildId=${pendingApproval.buildId}`;
                            return <tr key={index}>
                                <td>{pendingApproval.organizationName}</td>
                                <td>{pendingApproval.projectName}</td>
                                <td>{pendingApproval.buildDefinitionName}</td>
                                <td>{pendingApproval.buildId}</td>
                                <td>{pendingApproval.maybeStage}</td>
                                <td>
                                    <a className="button" href={href} rel="noreferrer" target="_blank">Open in a new tab</a>
                                </td>
                            </tr>
                        })
                        : <tr>
                            <td className="empty" colSpan={6}>No pending approvals found</td>
                        </tr>
                }</tbody>
            </table>
        </Box>;
    };

const Dashboard: React.FC<{ triggerLogoutRedirect: () => Promise<void>; }> =
    ({triggerLogoutRedirect}) => {
        const {accessToken} = useAccessToken();
        const [data, setData] = useState<Data | null>(null);

        const fetchAndStoreData = useCallback(() => {
            fetchData(accessToken).then(setData).catch(console.error);
        }, [accessToken]);

        useEffect(() => {
            if (data === null) {
                fetchAndStoreData();
            }

            const refreshIntervalId = window.setInterval(fetchAndStoreData, 30 * 1000);
            return () => window.clearInterval(refreshIntervalId);
        }, [data, fetchAndStoreData]);

        if (data === null) {
            return <ButtonBox buttonText="Logout" buttonOnClick={() => triggerLogoutRedirect().catch(console.error)}>
                <p>Fetching data...</p>
            </ButtonBox>;
        }

        return <>
            <IntroBox triggerLogoutRedirect={triggerLogoutRedirect}/>
            <PendingApprovalsBox pendingApprovals={data.pendingApprovals}/>
        </>;
    };

export const App: React.FC =
    () => {
        const accessTokenControls = useAccessTokenControls(true);

        switch (accessTokenControls._tag) {
            case accessTokenControlsTagLoggedOut:
                return <FullscreenCenter>
                    <ButtonBox buttonText="Login"
                               buttonOnClick={() => accessTokenControls.triggerLoginRedirect().catch(console.error)}>
                        <p>Use your Azure DevOps account.</p>
                    </ButtonBox>
                </FullscreenCenter>;
            case accessTokenControlsTagLoggingIn:
                return <FullscreenCenter>
                    <ButtonBox buttonText="Logout"
                               buttonOnClick={() => accessTokenControls.triggerLogoutRedirect().catch(console.error)}>
                        <p>Logging in…</p>
                    </ButtonBox>
                </FullscreenCenter>;
            case accessTokenControlsTagLoggedIn:
            case accessTokenControlsTagFetching:
                return <FullscreenCenter>
                    <ButtonBox buttonText="Logout"
                               buttonOnClick={() => accessTokenControls.triggerLogoutRedirect().catch(console.error)}>
                        <p>Fetching access token…</p>
                    </ButtonBox>
                </FullscreenCenter>;
            case accessTokenControlsTagAvailable:
                return <FullscreenCenter>
                    <Dashboard triggerLogoutRedirect={accessTokenControls.triggerLogoutRedirect}/>
                </FullscreenCenter>;
        }
    };
