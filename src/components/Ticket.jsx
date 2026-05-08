import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Ticket() {
  const [tickets, setTickets] = useState([]);
  const [marked, setMarked] = useState([]);
  const [count, setCount] = useState(1);
  const [gameStarted, setGameStarted] = useState(false);
  const navigate = useNavigate();
const [loading, setLoading] = useState(false);

    const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const getCombinations = (arr, k) => {
    if (k === 1) return arr.map((x) => [x]);
    const result = [];
    for (let i = 0; i <= arr.length - k; i++) {
      const rest = getCombinations(arr.slice(i + 1), k - 1);
      rest.forEach((combo) => result.push([arr[i], ...combo]));
    }
    return result;
  };

  const generateTicket = () => {
    // Step 1: Decide how many numbers go in each column (1, 2, or 3), summing to 15
    let colCounts;
    for (let attempt = 0; attempt < 1000; attempt++) {
      const counts = Array(9).fill(1); // start with 1 per col = 9 total
      let remaining = 6; // need 6 more to reach 15
      const colOrder = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]);
      for (const col of colOrder) {
        if (remaining <= 0) break;
        if (counts[col] < 3) {
          const add = Math.min(2, remaining, 3 - counts[col]);
          const actual = add === 2 ? (Math.random() < 0.5 ? 1 : 2) : 1;
          counts[col] += actual;
          remaining -= actual;
        }
      }
      // Distribute any leftover
      if (remaining > 0) {
        for (const col of colOrder) {
          if (remaining <= 0) break;
          if (counts[col] < 3) { counts[col]++; remaining--; }
        }
      }
      if (remaining === 0) { colCounts = counts; break; }
    }
    if (!colCounts) return generateTicket();

    // Step 2: Assign rows to each column's marks using backtracking
    // so every row ends up with exactly 5 filled cells
    const positions = Array.from({ length: 3 }, () => Array(9).fill(false));
    const rowCounts = [0, 0, 0];

    const assignRows = (col) => {
      if (col === 9) {
        return rowCounts[0] === 5 && rowCounts[1] === 5 && rowCounts[2] === 5;
      }
      const needed = colCounts[col];
      const combos = shuffle(getCombinations([0, 1, 2], needed));
      for (const combo of combos) {
        if (combo.every((r) => rowCounts[r] < 5)) {
          combo.forEach((r) => { positions[r][col] = true; rowCounts[r]++; });
          if (assignRows(col + 1)) return true;
          combo.forEach((r) => { positions[r][col] = false; rowCounts[r]--; });
        }
      }
      return false;
    };

    if (!assignRows(0)) return generateTicket(); // retry on rare failure

    // Step 3: Pick random numbers for each column, sorted top-to-bottom
    const ranges = [
      [1, 9], [10, 19], [20, 29], [30, 39], [40, 49],
      [50, 59], [60, 69], [70, 79], [80, 90],
    ];

    const ticket = Array.from({ length: 3 }, () => Array(9).fill(null));

    for (let col = 0; col < 9; col++) {
      const [min, max] = ranges[col];
      const pool = shuffle(Array.from({ length: max - min + 1 }, (_, i) => min + i));
      const nums = pool.slice(0, colCounts[col]).sort((a, b) => a - b);
      let idx = 0;
      for (let row = 0; row < 3; row++) {
        if (positions[row][col]) ticket[row][col] = nums[idx++];
      }
    }

    return ticket;
  };
const generateTickets = async () => {

  setLoading(true);

  setTimeout(() => {

    const usedNumbers = new Set();

    const result = [];

    const generateUniqueTicket = () => {

      let ticket;

      let valid = false;

      while (!valid) {

        ticket = generateTicket();

        const nums = ticket
          .flat()
          .filter(Boolean);

        const hasDuplicate = nums.some((n) =>
          usedNumbers.has(n)
        );

        if (!hasDuplicate) {

          nums.forEach((n) =>
            usedNumbers.add(n)
          );

          valid = true;
        }
      }

      return ticket;
    };

    for (let i = 0; i < count; i++) {

      result.push(generateUniqueTicket());
    }

    setTickets(result);

    setMarked([]);

    setGameStarted(true);

    setLoading(false);

  }, 500);
};

  const toggleMark = (num) => {
    if (!num) return;
    setMarked((prev) =>
      prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num]
    );
  };

  const startNewGame = () => {
    if (gameStarted) {
      const confirmReset = window.confirm(
        "Game is in progress. You will lose current tickets. Continue?"
      );

      if (!confirmReset) return;
    }

    setTickets([]);
    setMarked([]);
    setGameStarted(false);
  };

  return (
    <div
      style={{
        background: "#0f172a",
        minHeight: "100vh",
        padding: "30px",
        color: "white",
        fontFamily: "sans-serif",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          marginBottom: "30px",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: "38px",
            fontWeight: "700",
          }}
        >
          Tambola Tickets
        </h1>

        <p
          style={{
            color: "#94a3b8",
            marginTop: "8px",
          }}
        >
          Generate and play Tambola tickets
        </p>
      </div>

      {/* ACTIONS */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "15px",
          marginBottom: "30px",
          flexWrap: "wrap",
        }}
      >
       
        {!gameStarted && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "#1e293b",
              padding: "10px 15px",
              borderRadius: "10px",
            }}
          >
            <span
              style={{
                color: "#cbd5e1",
              }}
            >
              Tickets:
            </span>

            <select
              value={count}
              onChange={(e) =>
                setCount(Number(e.target.value))
              }
              style={{
                padding: "8px",
                borderRadius: "8px",
                border: "none",
                background: "#0f172a",
                color: "white",
                fontSize: "15px",
                outline: "none",
              }}
            >
              {[1, 2, 3, 4].map((n) => (
                <option
                  key={n}
                  value={n}
                >
                  {n}
                </option>
              ))}
            </select>
          </div>
        )}
         <button
          onClick={generateTickets}
          disabled={gameStarted || loading}
          style={{
            padding: "12px 20px",
            borderRadius: "10px",
            border: "none",
            background: gameStarted
              ? "#475569"
              : "#2563eb",
            color: "white",
            cursor: gameStarted
              ? "not-allowed"
              : "pointer",
            fontWeight: "600",
            transition: "0.3s",
          }}
        >
          {loading ? "Generating Tickets..." : "Generate Tickets"}
        </button>

        <button
          onClick={startNewGame}
          style={{
            padding: "12px 20px",
            borderRadius: "10px",
            border: "none",
            background: "#dc2626",
            color: "white",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          Start New Game
        </button>

        <button
  onClick={() => {
    const confirmLeave = window.confirm(
      "Current tickets will be lost. Go back to home?"
    );

    if (confirmLeave) {
      navigate("/");
    }
  }}
  style={{
    padding: "12px 20px",
    borderRadius: "10px",
    border: "none",
    background: "#334155",
    color: "white",
    cursor: "pointer",
    fontWeight: "600",
    transition: "0.3s",
  }}
>
  Back To Home
</button>
      </div>

      

      {/* TICKETS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(2, 620px)",
          gap: "20px",
          justifyContent: "center",
        }}
      >
        {tickets.map((ticket, index) => (
          <div
            key={index}
            style={{
              background: "#1e293b",
              padding: "15px",
              borderRadius: "18px",
              boxShadow:
                "0 8px 25px rgba(0,0,0,0.3)",
            }}
          >
            <h3
              style={{
                marginBottom: "15px",
                fontSize: "22px",
              }}
            >
              Ticket {index + 1}
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(9, 1fr)",
                gap: "6px",
              }}
            >
              {ticket.map((row, rIndex) =>
                row.map((cell, cIndex) => {
                  const isMarked =
                    marked.includes(cell);

                  return (
                    <div
                      key={`${rIndex}-${cIndex}`}
                      onClick={() =>
                        toggleMark(cell)
                      }
                      style={{
                        height: "45px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent:
                          "center",
                        borderRadius: "10px",
                        cursor: cell
                          ? "pointer"
                          : "default",
                        background: cell
                          ? isMarked
                            ? "#22c55e"
                            : "#f8fafc"
                          : "#0f172a",
                        color: cell
                          ? "#111827"
                          : "transparent",
                        fontWeight: "700",
                        fontSize: "16px",
                        transition: "0.2s",
                        border: cell
                          ? "2px solid transparent"
                          : "2px solid #1e293b",
                      }}
                    >
                      {cell ?? ""}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}