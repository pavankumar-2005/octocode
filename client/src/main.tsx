import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HeroUIProvider, ToastProvider } from "@heroui/react";
import "./lib/monaco";
import "./index.css";
import Home from "./pages/Home";
import Room from "./pages/Room";

document.documentElement.classList.add("dark");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HeroUIProvider>
      <ToastProvider placement="bottom-center" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/room/:id" element={<Room />} />
        </Routes>
      </BrowserRouter>
    </HeroUIProvider>
  </React.StrictMode>
);
