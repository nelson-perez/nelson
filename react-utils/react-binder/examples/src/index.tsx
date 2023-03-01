import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter } from "react-router-dom";
import { RouterProvider } from 'react-router-dom';

import App from './simple';

const router = createBrowserRouter([
    {
      path: "/",
      element: <App />,
    }
  ]);
  
  const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
  );
  root.render(
      <RouterProvider router={router} />
  );