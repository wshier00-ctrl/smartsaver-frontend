import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import Account from "./pages/Account";
import "./index.css";

const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/account", element: <Account /> },
  { path: "/success", element: <div className="p-8 text-center">Payment successful 🎉<br/>Thanks for upgrading to SmartSaver Premium.</div> },
  { path: "/canceled", element: <div className="p-8 text-center">Checkout canceled.</div> },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);