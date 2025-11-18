/* @refresh reload */
import { render } from "solid-js/web";
import { Router } from "@solidjs/router";

import { Toaster } from 'solid-toast';

import { AuthProvider } from "./context/AuthContext.jsx";
import App from "./App";

import "./index.css";

const root = document.getElementById("root");

render(
  () => (
    <AuthProvider>
      <Toaster/>
      <Router>
        <App />
      </Router>
    </AuthProvider>
  ),
  root
);
