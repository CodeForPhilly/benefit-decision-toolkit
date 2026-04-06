/* @refresh reload */
import { render } from "solid-js/web";
import { Router } from "@solidjs/router";

import { Toaster } from "solid-toast";

import { AuthProvider } from "./context/AuthContext.jsx";
import App from "./App";

import "./index.css";
import { MetaProvider, Title } from "@solidjs/meta";

const root = document.getElementById("root");

render(
  () => (
    <MetaProvider>
      <Title>Benefit Decision Toolkit - Home</Title>
      <AuthProvider>
        <Toaster />
        <App />
      </AuthProvider>
    </MetaProvider>
  ),
  root,
);
