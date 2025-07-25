// src/components/ProtectedRoute.jsx
import { useAuth } from "../../context/AuthContext";
import { Navigate } from "@solidjs/router";

export default function ProtectedRoute(props) {
  const { user } = useAuth();
  console.log("rendering protected route. user:");
  console.log(user());
  return user() ? props.children : <Navigate href="/login" />;
}
