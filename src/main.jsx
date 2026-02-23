import React, { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";

const App = lazy(() => import("./App.jsx"));
const ErrorPage = lazy(() => import("./components/ErrorPage.jsx"));

function Loader() {
  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="w-12 h-12 border-8 border-gray-300 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Suspense fallback={<Loader />}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Suspense>
  </StrictMode>
);
