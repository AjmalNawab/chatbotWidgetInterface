import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

window.ChatWidget = {
  init: (containerId = "root") => {
    const container = document.getElementById(containerId);
    if (container) {
      ReactDOM.createRoot(container).render(
        <React.StrictMode>
          <App />
        </React.StrictMode>
      );
    } else {
      console.error(`Container with id '${containerId}' not found`);
    }
  },
};
