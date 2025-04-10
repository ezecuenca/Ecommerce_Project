// js/app.js
/**
 * First we will load all of this project's JavaScript dependencies which
 * includes React and other helpers. It's a great starting point while
 * building robust, powerful web applications using React + Laravel.
 */
require("./bootstrap");

// Import React and ReactDOM
import React from "react";
import ReactDOM from "react-dom/client";

// Import the Routers component
import Routers from "./components/Routers";

// Mount the React app into the DOM
const root = ReactDOM.createRoot(document.getElementById("app"));
root.render(
  <React.StrictMode>
    <Routers />
  </React.StrictMode>
);