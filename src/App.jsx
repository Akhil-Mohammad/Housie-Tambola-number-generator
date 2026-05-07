import { Routes, Route } from "react-router-dom";
import NumberGenerator from "./components/NumberGenerator";
import Ticket from "./components/Ticket";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<NumberGenerator />} />
      <Route path="/ticket" element={<Ticket />} />
    </Routes>
  );
}