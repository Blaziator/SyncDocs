import {BrowserRouter as Router, Routes, Route} from "react-router-dom";

import Landing from "./pages/Landing/Landing.jsx";
import Login from "./pages/Login/Login.jsx";
import Register from "./pages/Register/Register.jsx";
import Dashboard from "./pages/Dashboard/Dashboard.jsx";
import Editor from "./pages/Editor/Editor.jsx";
import NotFound from "./pages/NotFound/NotFound.jsx";
import AccessDenied from "./pages/AccessDenied/AccessDenied.jsx";

import ProtectedRoute from "./components/ProtectedRoute.jsx";

function App() {

  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Landing/>}/>
          <Route path="/login" element={<Login/>}/>
          <Route path="/register" element={<Register/>}/>
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard/>
              </ProtectedRoute>
            }/>
          <Route path="/doc/:docId" element={<Editor/>}/>
          <Route path="/shared/:shareId" element={<Editor/>}/>
          <Route path="/access-denied" element={<AccessDenied />} />
          <Route path="/not-found" element={<NotFound />} />
          <Route path="*" element={<NotFound/>} />
        </Routes>
      </Router>
    </>
  )
}

export default App