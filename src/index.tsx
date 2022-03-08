import React from 'react';
import ReactDOM from 'react-dom';
import {App} from 'App';
import {AccessTokenProvider} from "azure/devops/react/authentication/AccessToken";

import "modern-normalize/modern-normalize.css";
import "./index.css";

ReactDOM.render(
    <React.StrictMode>
        <AccessTokenProvider>
            <App/>
        </AccessTokenProvider>
    </React.StrictMode>,
    document.getElementById("root")
);
