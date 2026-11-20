// import React from "react";
// import ReactDOM from "react-dom/client";
// import { BrowserRouter } from "react-router-dom";

// import App from "./App";
// import "./index.css";

// ReactDOM.createRoot(
//   document.getElementById("root")
// ).render(
//   <React.StrictMode>
//     <BrowserRouter>
//       <App />
//     </BrowserRouter>
//   </React.StrictMode>
// );

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";

import "./index.css";

const TAB_KEY = "tambola-tab-instance";
const CHANNEL_NAME = "tambola-tab-guard";

function generateTabId() {
  return crypto.randomUUID();
}

async function checkDuplicateTab() {
  let tabId = sessionStorage.getItem(TAB_KEY);

  if (!tabId) {
    tabId = generateTabId();
    sessionStorage.setItem(TAB_KEY, tabId);
  }

  // BroadcastChannel for detecting duplicated tabs
  if (!("BroadcastChannel" in window)) {
    console.warn("BroadcastChannel is not supported.");
    return true;
  }

  const channel = new BroadcastChannel(CHANNEL_NAME);

  const probeId = generateTabId();

  let duplicateDetected = false;

  channel.onmessage = (event) => {
    const data = event.data;

    // Existing tab responds to the duplicated tab
    if (
      data.type === "PROBE" &&
      data.tabId === tabId
    ) {
      channel.postMessage({
        type: "ALIVE",
        tabId: tabId,
        probeId: data.probeId,
      });
    }

    // Detect response from an existing tab
    if (
      data.type === "ALIVE" &&
      data.tabId === tabId &&
      data.probeId === probeId
    ) {
      duplicateDetected = true;
    }
  };

  // Check whether another tab has the same identity
  channel.postMessage({
    type: "PROBE",
    tabId: tabId,
    probeId: probeId,
  });

  // Allow existing tabs to respond
  await new Promise((resolve) =>
    setTimeout(resolve, 400)
  );

  channel.close();

  if (duplicateDetected) {
    // Give duplicated tab a new identity
    sessionStorage.setItem(
      TAB_KEY,
      generateTabId()
    );

    // Redirect duplicated tab to Home
    window.location.replace("/");

    return false;
  }

  return true;
}

// Initialize React only after duplicate detection
checkDuplicateTab().then((canRender) => {
  if (!canRender) return;

  ReactDOM.createRoot(
    document.getElementById("root")
  ).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
});