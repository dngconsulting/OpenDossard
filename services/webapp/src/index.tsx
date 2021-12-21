import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import "./index.css";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";
export const isDevMode = () => {
  return !process.env.NODE_ENV || process.env.NODE_ENV === "development";
};
ReactDOM.render(<App />, document.getElementById("root") as HTMLElement);
if (isDevMode()) serviceWorkerRegistration.unregister();
else serviceWorkerRegistration.register();
