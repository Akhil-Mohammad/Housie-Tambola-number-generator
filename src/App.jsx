// // import { Routes, Route } from "react-router-dom";
// // import NumberGenerator from "./components/NumberGenerator";
// // import Ticket from "./components/Ticket";
// // import Home from "./components/Home";

// // export default function App() {
// //   return (
// //     <Routes>
// //       <Route path="/" element={<Home />} />
// //       <Route path="/generator" element={<NumberGenerator />} />
// //       <Route path="/ticket" element={<Ticket />} />
// //     </Routes>
// //   );
// // }

// import { Routes, Route, Navigate } from "react-router-dom";

// import NumberGenerator from "./components/NumberGenerator";
// import Ticket from "./components/Ticket";
// import Home from "./components/Home";

// export default function App() {
//   return (
//     <Routes>
//       <Route path="/" element={<Home />} />

//       {/* Existing single-player route */}
//       <Route path="/generator" element={<NumberGenerator />} />

//       {/* Multiplayer route */}
//       <Route
//         path="/generator/:roomCode"
//         element={<NumberGenerator />}
//       />

//       {/* Existing ticket route */}
//       <Route path="/ticket" element={<Ticket />} />

//       {/* Multiplayer ticket route */}
//       <Route
//         path="/ticket/:roomCode"
//         element={<Ticket />}
//       />

//       {/* Invalid routes */}
//       <Route path="*" element={<Navigate to="/" replace />} />
//     </Routes>
//   );
// }

import { Routes, Route, Navigate } from "react-router-dom";

import Home from "./components/Home";
import NumberGenerator from "./components/NumberGenerator";
import Ticket from "./components/Ticket";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route
        path="/generator"
        element={<NumberGenerator />}
      />

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

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}