// src/components/ProtectedRoute.jsx
import { useAuth } from "../../context/AuthContext";
import { Navigate } from "@solidjs/router";

export default function ProtectedRoute(props) {
  const { user } = useAuth();
  return user() ? props.children : <Navigate href="/login" />;
}
