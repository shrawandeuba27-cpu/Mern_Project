import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./component/Login";
import Signup from "./component/Signup";
import ProtectedRoute from "./component/ProtectedRoute";
import Layout from "./ui/Layout";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import StockMove from "./pages/StockMove";
import Report from "./pages/Report";
import Profile from "./pages/Profile";

const NavRoute = () => {
  return (
    <Routes>
      {/* public pages */}
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* every page below needs the token, and shares the sidebar layout */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/stock-in" element={<StockMove type="in" />} />
        <Route path="/stock-out" element={<StockMove type="out" />} />
        <Route path="/reports" element={<Report />} />
        <Route path="/transactions" element={<Navigate to="/reports" replace />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default NavRoute;
