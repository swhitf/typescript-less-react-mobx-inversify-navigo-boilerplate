import * as React from 'react';
import { WelcomePage } from "./components/WelcomePage";
import { TestPage } from "./components/TestPage";


export const install = () => [
    {
        name: 'app.test',
        path: '/test',
        view: p => <TestPage></TestPage>
    },
    {
        name: 'app.default',
        path: '/',
        view: p => <WelcomePage></WelcomePage>
    },
];