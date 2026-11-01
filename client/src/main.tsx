import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import { HeroUIProvider, ToastProvider } from "@heroui/react";
import "./lib/monaco";
import "./index.css";
import { AuthProvider } from "./lib/auth";
import { ThemeProvider } from "./lib/theme";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Projects from "./pages/Projects";
import Room from "./pages/Room";

// HeroUI links (<Button as={Link}>, <Card isPressable>) navigate through React Router, without a page reload.
function App() {
  const navigate = useNavigate();
  return (
    <HeroUIProvider navigate={navigate}>
      <ToastProvider placement="bottom-center" />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/room/:id" element={<Room />} />
      </Routes>
    </HeroUIProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
