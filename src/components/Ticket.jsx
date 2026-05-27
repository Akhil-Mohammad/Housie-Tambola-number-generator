// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";

// export default function Ticket() {
//   const [tickets, setTickets] = useState([]);
//   const [marked, setMarked] = useState([]);
//   const [count, setCount] = useState(1);
//   const [gameStarted, setGameStarted] = useState(false);
//   const [loading, setLoading] = useState(false);

//   const [screenWidth, setScreenWidth] = useState(window.innerWidth);

//   const navigate = useNavigate();

//   // RESPONSIVE
//   useEffect(() => {
//     const handleResize = () => {
//       setScreenWidth(window.innerWidth);
//     };

//     window.addEventListener("resize", handleResize);

//     return () =>
//       window.removeEventListener("resize", handleResize);
//   }, []);

//   const shuffle = (arr) => {
//     const a = arr.slice();

//     for (let i = a.length - 1; i > 0; i--) {
//       const j = Math.floor(Math.random() * (i + 1));

//       [a[i], a[j]] = [a[j], a[i]];
//     }

//     return a;
//   };

//   const getCombinations = (arr, k) => {
//     if (k === 1) return arr.map((x) => [x]);

//     const result = [];

//     for (let i = 0; i <= arr.length - k; i++) {
//       const rest = getCombinations(
//         arr.slice(i + 1),
//         k - 1
//       );

//       rest.forEach((combo) =>
//         result.push([arr[i], ...combo])
//       );
//     }

//     return result;
//   };

//   const generateTicket = () => {
//     let colCounts;

//     for (let attempt = 0; attempt < 1000; attempt++) {
//       const counts = Array(9).fill(1);

//       let remaining = 6;

//       const colOrder = shuffle([
//         0, 1, 2, 3, 4, 5, 6, 7, 8,
//       ]);

//       for (const col of colOrder) {
//         if (remaining <= 0) break;

//         if (counts[col] < 3) {
//           const add = Math.min(
//             2,
//             remaining,
//             3 - counts[col]
//           );

//           const actual =
//             add === 2
//               ? Math.random() < 0.5
//                 ? 1
//                 : 2
//               : 1;

//           counts[col] += actual;

//           remaining -= actual;
//         }
//       }

//       if (remaining > 0) {
//         for (const col of colOrder) {
//           if (remaining <= 0) break;

//           if (counts[col] < 3) {
//             counts[col]++;

//             remaining--;
//           }
//         }
//       }

//       if (remaining === 0) {
//         colCounts = counts;

//         break;
//       }
//     }

//     if (!colCounts) return generateTicket();

//     const positions = Array.from(
//       { length: 3 },
//       () => Array(9).fill(false)
//     );

//     const rowCounts = [0, 0, 0];

//     const assignRows = (col) => {
//       if (col === 9) {
//         return (
//           rowCounts[0] === 5 &&
//           rowCounts[1] === 5 &&
//           rowCounts[2] === 5
//         );
//       }

//       const needed = colCounts[col];

//       const combos = shuffle(
//         getCombinations([0, 1, 2], needed)
//       );

//       for (const combo of combos) {
//         if (
//           combo.every((r) => rowCounts[r] < 5)
//         ) {
//           combo.forEach((r) => {
//             positions[r][col] = true;

//             rowCounts[r]++;
//           });

//           if (assignRows(col + 1)) return true;

//           combo.forEach((r) => {
//             positions[r][col] = false;

//             rowCounts[r]--;
//           });
//         }
//       }

//       return false;
//     };

//     if (!assignRows(0))
//       return generateTicket();

//     const ranges = [
//       [1, 9],
//       [10, 19],
//       [20, 29],
//       [30, 39],
//       [40, 49],
//       [50, 59],
//       [60, 69],
//       [70, 79],
//       [80, 90],
//     ];

//     const ticket = Array.from(
//       { length: 3 },
//       () => Array(9).fill(null)
//     );

//     for (let col = 0; col < 9; col++) {
//       const [min, max] = ranges[col];

//       const pool = shuffle(
//         Array.from(
//           { length: max - min + 1 },
//           (_, i) => min + i
//         )
//       );

//       const nums = pool
//         .slice(0, colCounts[col])
//         .sort((a, b) => a - b);

//       let idx = 0;

//       for (let row = 0; row < 3; row++) {
//         if (positions[row][col])
//           ticket[row][col] = nums[idx++];
//       }
//     }

//     return ticket;
//   };

//   const generateTickets = async () => {
//     setLoading(true);

//     setTimeout(() => {
//       const usedNumbers = new Set();

//       const result = [];

//       const generateUniqueTicket = () => {
//         let ticket;

//         let valid = false;

//         while (!valid) {
//           ticket = generateTicket();

//           const nums = ticket
//             .flat()
//             .filter(Boolean);

//           const hasDuplicate = nums.some(
//             (n) => usedNumbers.has(n)
//           );

//           if (!hasDuplicate) {
//             nums.forEach((n) =>
//               usedNumbers.add(n)
//             );

//             valid = true;
//           }
//         }

//         return ticket;
//       };

//       for (let i = 0; i < count; i++) {
//         result.push(generateUniqueTicket());
//       }

//       setTickets(result);

//       setMarked([]);

//       setGameStarted(true);

//       setLoading(false);
//     }, 500);
//   };

//   const toggleMark = (num) => {
//     if (!num) return;

//     setMarked((prev) =>
//       prev.includes(num)
//         ? prev.filter((n) => n !== num)
//         : [...prev, num]
//     );
//   };

//   const startNewGame = () => {
//     if (gameStarted) {
//       const confirmReset = window.confirm(
//         "Game is in progress. You will lose current tickets. Continue?"
//       );

//       if (!confirmReset) return;
//     }

//     setTickets([]);

//     setMarked([]);

//     setGameStarted(false);
//   };

//   return (
//     <div
//       style={{
//         background: "#0f172a",
//         minHeight: "100vh",

//         padding:
//           screenWidth < 600 ? "15px" : "30px",

//         color: "white",

//         fontFamily: "sans-serif",

//         overflowX: "hidden",

//         boxSizing: "border-box",
//       }}
//     >
//       {/* HEADER */}
//       <div
//         style={{
//           marginBottom: "30px",
//         }}
//       >
//         <h1
//           style={{
//             margin: 0,

//             fontSize:
//               screenWidth < 600 ? "30px" : "38px",

//             fontWeight: "700",
//           }}
//         >
//           Tambola Tickets
//         </h1>

//         <p
//           style={{
//             color: "#94a3b8",

//             marginTop: "8px",

//             fontSize:
//               screenWidth < 600 ? "14px" : "16px",
//           }}
//         >
//           Generate and play Tambola tickets
//         </p>
//       </div>

//       {/* ACTIONS */}
//       <div
//         style={{
//           display: "flex",

//           flexDirection:
//             screenWidth < 700 ? "column" : "row",

//           alignItems:
//             screenWidth < 700
//               ? "stretch"
//               : "center",

//           gap: "15px",

//           marginBottom: "30px",

//           flexWrap: "wrap",
//         }}
//       >
//         {!gameStarted && (
//           <div
//             style={{
//               display: "flex",

//               alignItems: "center",

//               justifyContent:
//                 screenWidth < 700
//                   ? "space-between"
//                   : "center",

//               gap: "10px",

//               background: "#1e293b",

//               padding: "10px 15px",

//               borderRadius: "10px",

//               width:
//                 screenWidth < 700
//                   ? "100%"
//                   : "auto",

//               boxSizing: "border-box",
//             }}
//           >
//             <span
//               style={{
//                 color: "#cbd5e1",
//               }}
//             >
//               Tickets:
//             </span>

//             <select
//               value={count}
//               onChange={(e) =>
//                 setCount(Number(e.target.value))
//               }
//               style={{
//                 padding: "8px",

//                 borderRadius: "8px",

//                 border: "none",

//                 background: "#0f172a",

//                 color: "white",

//                 fontSize: "15px",

//                 outline: "none",
//               }}
//             >
//               {[1, 2, 3, 4].map((n) => (
//                 <option
//                   key={n}
//                   value={n}
//                 >
//                   {n}
//                 </option>
//               ))}
//             </select>
//           </div>
//         )}

//         <button
//           onClick={generateTickets}
//           disabled={gameStarted || loading}
//           style={{
//             padding: "12px 20px",

//             borderRadius: "10px",

//             border: "none",

//             background: gameStarted
//               ? "#475569"
//               : "#2563eb",

//             color: "white",

//             cursor: gameStarted
//               ? "not-allowed"
//               : "pointer",

//             fontWeight: "600",

//             transition: "0.3s",

//             width:
//               screenWidth < 700
//                 ? "100%"
//                 : "auto",
//           }}
//         >
//           {loading
//             ? "Generating Tickets..."
//             : "Generate Tickets"}
//         </button>

//         <button
//           onClick={startNewGame}
//           style={{
//             padding: "12px 20px",

//             borderRadius: "10px",

//             border: "none",

//             background: "#dc2626",

//             color: "white",

//             cursor: "pointer",

//             fontWeight: "600",

//             width:
//               screenWidth < 700
//                 ? "100%"
//                 : "auto",
//           }}
//         >
//           Start New Game
//         </button>

//         <button
//           onClick={() => {
//             const confirmLeave =
//               window.confirm(
//                 "Current tickets will be lost. Go back to home?"
//               );

//             if (confirmLeave) {
//               navigate("/");
//             }
//           }}
//           style={{
//             padding: "12px 20px",

//             borderRadius: "10px",

//             border: "none",

//             background: "#334155",

//             color: "white",

//             cursor: "pointer",

//             fontWeight: "600",

//             transition: "0.3s",

//             width:
//               screenWidth < 700
//                 ? "100%"
//                 : "auto",
//           }}
//         >
//           Back To Home
//         </button>
//       </div>

//       {/* TICKETS */}
//       <div
//         style={{
//           display: "grid",

//           gridTemplateColumns:
//             screenWidth < 700
//               ? "1fr"
//               : "repeat(2, 1fr)",

//           gap: "20px",

//           justifyContent: "center",
//         }}
//       >
//         {tickets.map((ticket, index) => (
//           <div
//             key={index}
//             style={{
//               background: "#1e293b",

//               padding:
//                 screenWidth < 600
//                   ? "12px"
//                   : "15px",

//               borderRadius: "18px",

//               boxShadow:
//                 "0 8px 25px rgba(0,0,0,0.3)",

//               overflowX: "auto",
//             }}
//           >
//             <h3
//               style={{
//                 marginBottom: "15px",

//                 fontSize:
//                   screenWidth < 600
//                     ? "18px"
//                     : "22px",
//               }}
//             >
//               Ticket {index + 1}
//             </h3>

//             <div
//               style={{
//                 display: "grid",

//                 gridTemplateColumns:
//                   "repeat(9, 1fr)",

//                 gap:
//                   screenWidth < 600
//                     ? "4px"
//                     : "6px",

//                 minWidth:
//                   screenWidth < 600
//                     ? "100%"
//                     : "auto",
//               }}
//             >
//               {ticket.map((row, rIndex) =>
//                 row.map((cell, cIndex) => {
//                   const isMarked =
//                     marked.includes(cell);

//                   return (
//                     <div
//                       key={`${rIndex}-${cIndex}`}
//                       onClick={() =>
//                         toggleMark(cell)
//                       }
//                       style={{
//                         height:
//                           screenWidth < 600
//                             ? "36px"
//                             : "45px",

//                         display: "flex",

//                         alignItems: "center",

//                         justifyContent:
//                           "center",

//                         borderRadius:
//                           screenWidth < 600
//                             ? "8px"
//                             : "10px",

//                         cursor: cell
//                           ? "pointer"
//                           : "default",

//                         background: cell
//                           ? isMarked
//                             ? "#22c55e"
//                             : "#f8fafc"
//                           : "#0f172a",

//                         color: cell
//                           ? "#111827"
//                           : "transparent",

//                         fontWeight: "700",

//                         fontSize:
//                           screenWidth < 600
//                             ? "13px"
//                             : "16px",

//                         transition: "0.2s",

//                         border: cell
//                           ? "2px solid transparent"
//                           : "2px solid #1e293b",

//                         boxSizing: "border-box",
//                       }}
//                     >
//                       {cell ?? ""}
//                     </div>
//                   );
//                 })
//               )}
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

import React, {
  useState,
  useEffect,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  ref,
  onValue,
  update,
  remove,
} from "firebase/database";

import { db } from "../firebase";

export default function Ticket() {
  const navigate = useNavigate();

  const { roomCode } = useParams();

  const [tickets, setTickets] =
    useState([]);

  const [marked, setMarked] =
    useState([]);

  const [count, setCount] =
    useState(1);

  const [gameStarted,
    setGameStarted] =
    useState(false);

  const [loading,
    setLoading] =
    useState(false);

  const [generatedNumbers,
    setGeneratedNumbers] =
    useState([]);

  const [playerName,
    setPlayerName] =
    useState("");

  const [joined,
    setJoined] =
    useState(false);

  const [autoMark,
    setAutoMark] =
    useState(true);

  const [roomCodeInput,
    setRoomCodeInput] =
    useState("");

  const [screenWidth,
    setScreenWidth] =
    useState(window.innerWidth);

  const [playerId] = useState(
    localStorage.getItem(
      "playerId"
    ) ||
      Date.now().toString()
  );

  // RESPONSIVE
  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(
        window.innerWidth
      );
    };

    window.addEventListener(
      "resize",
      handleResize
    );

    return () =>
      window.removeEventListener(
        "resize",
        handleResize
      );
  }, []);

  // RESTORE SESSION
  useEffect(() => {
    const savedName =
      localStorage.getItem(
        "playerName"
      );

    const savedRoom =
      localStorage.getItem(
        "roomCode"
      );

    const savedTickets =
      localStorage.getItem(
        "tickets"
      );

    if (savedName) {
      setPlayerName(savedName);
    }

    if (savedTickets) {
      setTickets(
        JSON.parse(savedTickets)
      );

      setGameStarted(true);
    }

    if (
      savedRoom &&
      !roomCode
    ) {
      navigate(
        `/ticket/${savedRoom}`
      );
    }

    if (
      savedName &&
      savedRoom
    ) {
      setJoined(true);
    }
  }, []);

  // AUTO JOIN URL
  useEffect(() => {
    if (roomCode) {
      setJoined(true);
    }
  }, [roomCode]);

  // LIVE NUMBER SYNC
  useEffect(() => {
    if (!roomCode) return;

    const roomRef = ref(
      db,
      `rooms/${roomCode}`
    );

    return onValue(
      roomRef,
      (snapshot) => {
        const data =
          snapshot.val();

        if (
          data?.generatedNumbers
        ) {
          setGeneratedNumbers(
            data.generatedNumbers
          );
        } else {
          setGeneratedNumbers(
            []
          );
        }
      }
    );
  }, [roomCode]);

  const lastTen =
    generatedNumbers
      .slice(-10)
      .reverse();

  // HOME / LEAVE ROOM
  const goHome = async () => {
    try {
      const savedRoom =
        localStorage.getItem(
          "roomCode"
        );

      const savedPlayer =
        localStorage.getItem(
          "playerId"
        );

      if (
        savedRoom &&
        savedPlayer
      ) {
        await remove(
          ref(
            db,
            `rooms/${savedRoom}/players/${savedPlayer}`
          )
        );
      }

      localStorage.removeItem(
        "roomCode"
      );

      localStorage.removeItem(
        "playerName"
      );

      localStorage.removeItem(
        "playerId"
      );

      localStorage.removeItem(
        "tickets"
      );

      navigate("/");
    } catch (err) {
      console.log(err);
    }
  };

  // SHUFFLE
  const shuffle = (arr) => {
    const a = arr.slice();

    for (
      let i = a.length - 1;
      i > 0;
      i--
    ) {
      const j = Math.floor(
        Math.random() *
          (i + 1)
      );

      [a[i], a[j]] =
        [a[j], a[i]];
    }

    return a;
  };

  // COMBINATIONS
  const getCombinations = (
    arr,
    k
  ) => {
    if (k === 1)
      return arr.map(
        (x) => [x]
      );

    const result = [];

    for (
      let i = 0;
      i <= arr.length - k;
      i++
    ) {
      const rest =
        getCombinations(
          arr.slice(i + 1),
          k - 1
        );

      rest.forEach(
        (combo) =>
          result.push([
            arr[i],
            ...combo,
          ])
      );
    }

    return result;
  };

  // GENERATE TICKET
  const generateTicket =
    () => {
      let colCounts;

      for (
        let attempt = 0;
        attempt < 1000;
        attempt++
      ) {
        const counts =
          Array(9).fill(1);

        let remaining = 6;

        const colOrder =
          shuffle([
            0,1,2,3,4,
            5,6,7,8,
          ]);

        for (const col of colOrder) {
          if (
            remaining <= 0
          )
            break;

          if (
            counts[col] < 3
          ) {
            counts[col]++;

            remaining--;
          }
        }

        if (
          remaining === 0
        ) {
          colCounts =
            counts;

          break;
        }
      }

      const positions =
        Array.from(
          { length: 3 },
          () =>
            Array(9).fill(
              false
            )
        );

      const rowCounts = [
        0,0,0,
      ];

      const assignRows = (
        col
      ) => {
        if (col === 9) {
          return (
            rowCounts[0] ===
              5 &&
            rowCounts[1] ===
              5 &&
            rowCounts[2] ===
              5
          );
        }

        const needed =
          colCounts[col];

        const combos =
          shuffle(
            getCombinations(
              [0,1,2],
              needed
            )
          );

        for (const combo of combos) {
          if (
            combo.every(
              (r) =>
                rowCounts[
                  r
                ] < 5
            )
          ) {
            combo.forEach(
              (r) => {
                positions[r][col] =
                  true;

                rowCounts[r]++;
              }
            );

            if (
              assignRows(
                col + 1
              )
            )
              return true;

            combo.forEach(
              (r) => {
                positions[r][col] =
                  false;

                rowCounts[r]--;
              }
            );
          }
        }

        return false;
      };

      assignRows(0);

      const ranges = [
        [1,9],
        [10,19],
        [20,29],
        [30,39],
        [40,49],
        [50,59],
        [60,69],
        [70,79],
        [80,90],
      ];

      const ticket =
        Array.from(
          { length: 3 },
          () =>
            Array(9).fill(
              null
            )
        );

      for (
        let col = 0;
        col < 9;
        col++
      ) {
        const [min, max] =
          ranges[col];

        const pool =
          shuffle(
            Array.from(
              {
                length:
                  max -
                  min +
                  1,
              },
              (_, i) =>
                min + i
            )
          );

        const nums = pool
          .slice(
            0,
            colCounts[col]
          )
          .sort(
            (a,b) =>
              a - b
          );

        let idx = 0;

        for (
          let row = 0;
          row < 3;
          row++
        ) {
          if (
            positions[row][col]
          ) {
            ticket[row][col] =
              nums[idx++];
          }
        }
      }

      return ticket;
    };

  // GENERATE TICKETS
  const generateTickets =
    () => {
      setLoading(true);

      setTimeout(() => {
        const result = [];

        for (
          let i = 0;
          i < count;
          i++
        ) {
          result.push(
            generateTicket()
          );
        }

        setTickets(result);

        localStorage.setItem(
          "tickets",
          JSON.stringify(result)
        );

        setMarked([]);

        setGameStarted(
          true
        );

        setLoading(false);
      }, 500);
    };

  // MARK
  const toggleMark = (
    num
  ) => {
    if (!num) return;

    setMarked((prev) =>
      prev.includes(num)
        ? prev.filter(
            (n) =>
              n !== num
          )
        : [...prev, num]
    );
  };

  // RESET
  const startNewGame =
    () => {
      localStorage.removeItem(
        "tickets"
      );

      setTickets([]);

      setMarked([]);

      setGameStarted(
        false
      );
    };

  // JOIN SCREEN
  if (!joined) {
    return (
      <div
        style={{
          background:
            "#0f172a",
          minHeight:
            "100vh",
          display:
            "flex",
          justifyContent:
            "center",
          alignItems:
            "center",
          flexDirection:
            "column",
          color: "white",
          gap: "20px",
        }}
      >
        <h1>
          Join Multiplayer
        </h1>

        <input
          placeholder="Room Code"
          value={
            roomCodeInput
          }
          onChange={(e) =>
            setRoomCodeInput(
              e.target.value.toUpperCase()
            )
          }
        />

        <input
          placeholder="Player Name"
          value={
            playerName
          }
          onChange={(e) =>
            setPlayerName(
              e.target.value
            )
          }
        />

        <button
          onClick={() => {
            if (
              !roomCodeInput ||
              !playerName
            ) {
              alert(
                "Enter details"
              );

              return;
            }

            update(
              ref(
                db,
                `rooms/${roomCodeInput}/players`
              ),
              {
                [playerId]:
                  {
                    name:
                      playerName,
                  },
              }
            );

            localStorage.setItem(
              "playerName",
              playerName
            );

            localStorage.setItem(
              "roomCode",
              roomCodeInput
            );

            localStorage.setItem(
              "playerId",
              playerId
            );

            navigate(
              `/ticket/${roomCodeInput}`
            );

            setJoined(true);
          }}
        >
          Join Game
        </button>

        <button
          onClick={() =>
            setJoined(true)
          }
        >
          Continue Normal
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        background:
          "#0f172a",
        minHeight:
          "100vh",
        padding: "30px",
        color: "white",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems:
            "center",
          marginBottom:
            "20px",
        }}
      >
        <h1>
          Tambola Tickets
        </h1>

        <button
          onClick={goHome}
          style={{
            padding:
              "10px 20px",
            borderRadius:
              "10px",
            border: "none",
            background:
              "#ef4444",
            color: "white",
          }}
        >
          Home
        </button>
      </div>

      <h3>
        Last 10 Numbers
      </h3>

      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap:
            "wrap",
          marginBottom:
            "20px",
        }}
      >
        {lastTen.map(
          (num, index) => (
            <div
              key={index}
              style={{
                width: "45px",
                height: "45px",
                borderRadius:
                  "50%",
                background:
                  "#2563eb",
                display: "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
              }}
            >
              {num}
            </div>
          )
        )}
      </div>

      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom:
            "20px",
        }}
      >
        <button
          onClick={
            generateTickets
          }
        >
          Generate Tickets
        </button>

        <button
          onClick={
            startNewGame
          }
        >
          Reset
        </button>

        <label>
          <input
            type="checkbox"
            checked={
              autoMark
            }
            onChange={() =>
              setAutoMark(
                !autoMark
              )
            }
          />
          Auto Mark
        </label>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            screenWidth < 700
              ? "1fr"
              : "repeat(2,1fr)",
          gap: "20px",
        }}
      >
        {tickets.map(
          (ticket,index)=>(
            <div
              key={index}
              style={{
                background:
                  "#1e293b",
                padding:
                  "15px",
                borderRadius:
                  "18px",
              }}
            >
              <h3>
                Ticket{" "}
                {index + 1}
              </h3>

              <div
                style={{
                  display:
                    "grid",
                  gridTemplateColumns:
                    "repeat(9,1fr)",
                  gap: "6px",
                }}
              >
                {ticket.map(
                  (
                    row,
                    rIndex
                  ) =>
                    row.map(
                      (
                        cell,
                        cIndex
                      ) => {
                        const isMarked =
                          autoMark
                            ? generatedNumbers.includes(
                                cell
                              )
                            : marked.includes(
                                cell
                              );

                        return (
                          <div
                            key={`${rIndex}-${cIndex}`}
                            onClick={() =>
                              toggleMark(
                                cell
                              )
                            }
                            style={{
                              height:
                                "45px",
                              display:
                                "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              borderRadius:
                                "10px",
                              background:
                                cell
                                  ? isMarked
                                    ? "#22c55e"
                                    : "#f8fafc"
                                  : "#0f172a",
                              color:
                                cell
                                  ? "#111827"
                                  : "transparent",
                            }}
                          >
                            {cell ?? ""}
                          </div>
                        );
                      }
                    )
                )}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}