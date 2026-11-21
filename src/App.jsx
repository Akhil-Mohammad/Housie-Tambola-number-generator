import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./components/Home";
import NumberGenerator from "./components/NumberGenerator";
import Ticket from "./components/Ticket";
import { ThemeProvider } from "./context/ThemeContext";
import ThemeToggle from "./components/ThemeToggle";
import "./styles/global.css";

export default function App() {
  return <ThemeProvider>
    <ThemeToggle />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/generator" element={<NumberGenerator />} />
      <Route path="/generator/:roomCode" element={<NumberGenerator />} />
      <Route path="/ticket" element={<Ticket />} />
      <Route path="/ticket/:roomCode" element={<Ticket />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </ThemeProvider>;
}
