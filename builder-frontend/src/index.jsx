/* @refresh reload */
import { render } from "solid-js/web";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { Router } from "@solidjs/router";

const root = document.getElementById("root");

render(
  () => (
    <AuthProvider>
      <Router>
        <App />
      </Router>
    </AuthProvider>
  ),
  root
);
