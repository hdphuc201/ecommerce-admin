import { lazy } from 'react';
import { path } from './config/path';
const Page404 = lazy(() => import('./pages/404/404'));
const Admin = lazy(() => import('./pages/Admin/Admin'));
const Home = lazy(() => import('./pages'));
const routers = [
    {
        path: path.Home,
        element: <Home />,
    },
    {
        path: path.Admin,
        element: <Admin />,
    },
    {
        path:'*',
        element: <Page404 />,
    },
];

export default routers;
