import React from "react";
import Home from "./components/Home";
import Admin from "./components/Admin";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

export default function App(): React.JSX.Element {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
}
