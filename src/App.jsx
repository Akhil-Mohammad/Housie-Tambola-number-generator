// import { Routes, Route } from "react-router-dom";
// import NumberGenerator from "./components/NumberGenerator";
// import Ticket from "./components/Ticket";
// import Home from "./components/Home";

// export default function App() {
//   return (
//     <Routes>
//       <Route path="/" element={<Home />} />
//       <Route path="/generator" element={<NumberGenerator />} />
//       <Route path="/ticket" element={<Ticket />} />
//     </Routes>
//   );
// }

import { Routes, Route } from "react-router-dom";

import Home from "./components/Home";
import NumberGenerator from "./components/NumberGenerator";
import Ticket from "./components/Ticket";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route
        path="/generator/:roomCode"
        element={<NumberGenerator />}
      />

      <Route
        path="/ticket"
        element={<Ticket />}
      />

      <Route
        path="/ticket/:roomCode"
        element={<Ticket />}
      />
    </Routes>
  );
}