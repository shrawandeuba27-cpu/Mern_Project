import { Navigate } from "react-router-dom";

// children = whatever we wrap inside <ProtectedRoute> ... </ProtectedRoute>
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  // no token = not logged in = send to the login page
  if (!token) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
