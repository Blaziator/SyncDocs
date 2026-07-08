import { Navigate } from "react-router-dom";
import Login from "../pages/Login/Login";

function ProtectedRoute({children}) {

    const isAuthenticated = false;

    if(!isAuthenticated){
        return <Navigate to="/login"replace/>
    }

    return children;
  
}

export default ProtectedRoute;