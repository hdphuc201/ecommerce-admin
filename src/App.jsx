import { useRoutes } from 'react-router-dom';
import routers from './router';
import { Spin } from 'antd';
import { Suspense } from 'react';
import { ToastContainer } from 'react-toastify';

function App() {
    const element = useRoutes(routers);

    return (
        <>
            <Suspense
                fallback={
                    <div className="flex justify-center items-center h-screen">
                        <Spin />
                    </div>
                }
            >
              <div className="h-[100vh] w-full">
                  {element}
              </div>
              <ToastContainer />
            </Suspense>
        </>
    );
}

export default App;
