import {BrowserRouter as Router, Routes, Route} from "react-router-dom";

import Landing from "./pages/Landing/Landing.jsx";
import Login from "./pages/Login/Login.jsx";
import Register from "./pages/Register/Register.jsx";
import Dashboard from "./pages/Dashboard/Dashboard.jsx";
import Editor from "./pages/Editor/Editor.jsx";

function App() {

  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Landing/>}/>
          <Route path="/login" element={<Login/>}/>
          <Route path="/register" element={<Register/>}/>
          <Route path="/dashboard" element={<Dashboard/>}/>
          <Route path="/doc/:docId" element={<Editor/>}/>
        </Routes>
      </Router>
    </>
  )
}

export default App
