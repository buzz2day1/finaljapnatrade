import { useState } from "react";
import AdminAuth from "./AdminAuth";
import AdminPage from "./AdminPage";
import { useNavigate } from "react-router-dom";

const AdminRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/");
  };

  if (!isAuthenticated) {
    return <AdminAuth onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return <AdminPage onBack={handleBack} />;
};

export default AdminRoute;
