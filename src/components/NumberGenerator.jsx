// import React, {
//   useState,
//   useEffect,
//   useRef,
// } from "react";

// import {
//   useNavigate,
//   useParams,
// } from "react-router-dom";

// import { onValue, ref } from "firebase/database";
// import { db } from "../firebase";
// import { getActiveRoom, publishNextNumber, resetRoomNumbers } from "../services/roomService";


// // DUPLICATE TAB DETECTION
// function useDuplicateTabRedirect() {
//   useEffect(() => {
//     const STORAGE_KEY = "tambola_tab_id";
//     const CHANNEL_NAME = "tambola_tab_channel";

//     let tabId = sessionStorage.getItem(STORAGE_KEY);

//     if (!tabId) {
//       tabId = crypto.randomUUID();
//       sessionStorage.setItem(STORAGE_KEY, tabId);
//     }

//     if (!("BroadcastChannel" in window)) {
//       console.warn("BroadcastChannel is not supported.");
//       return;
//     }

//     const channel = new BroadcastChannel(CHANNEL_NAME);

//     const requestId = crypto.randomUUID();
//     let duplicateDetected = false;

//     channel.onmessage = (event) => {
//       const message = event.data;

//       // Existing tab responds to the duplicate tab
//       if (
//         message.type === "CHECK_TAB" &&
//         message.tabId === tabId
//       ) {
//         channel.postMessage({
//           type: "TAB_EXISTS",
//           tabId: tabId,
//           requestId: message.requestId,
//         });
//       }

//       // Duplicate tab receives the response
//       if (
//         message.type === "TAB_EXISTS" &&
//         message.requestId === requestId
//       ) {
//         duplicateDetected = true;

//         // Give the duplicate a new identity
//         sessionStorage.setItem(
//           STORAGE_KEY,
//           crypto.randomUUID()
//         );

//         window.location.replace("/");
//       }
//     };

//     // Check whether another tab already has this identity
//     const timer = setTimeout(() => {
//       if (!duplicateDetected) {
//         channel.postMessage({
//           type: "CHECK_TAB",
//           tabId: tabId,
//           requestId: requestId,
//         });
//       }
//     }, 300);

//     return () => {
//       clearTimeout(timer);
//       channel.close();
//     };
//   }, []);
// }

// export default function NumberGenerator() {


//    useDuplicateTabRedirect();
  
//   const numbers = Array.from(
//     { length: 90 },
//     (_, i) => i + 1
//   );

//   const navigate = useNavigate();

//   const { roomCode } = useParams();
  

//   const intervalRef = useRef(null);

//   const [generated, setGenerated] =
//     useState([]);

//   const [current, setCurrent] =
//     useState(null);

//   const [playerCount,
//     setPlayerCount] =
//     useState(0);

//   const [players, setPlayers] = useState([]);

//   const [autoPlay,
//     setAutoPlay] =
//     useState(false);

//   const [intervalTime,
//     setIntervalTime] =
//     useState(3000);

//   const [soundOn,
//     setSoundOn] =
//     useState(true);

//   const [darkMode,
//     setDarkMode] =
//     useState(() => {
//       const saved =
//         localStorage.getItem(
//           "theme"
//         );

//       return saved
//         ? JSON.parse(saved)
//         : true;
//     });

//   const [screenWidth,
//     setScreenWidth] =
//     useState(window.innerWidth);

//   // THEME SAVE
//   useEffect(() => {
//     localStorage.setItem(
//       "theme",
//       JSON.stringify(darkMode)
//     );
//   }, [darkMode]);

//   // RESPONSIVE
//   useEffect(() => {
//     const handleResize = () => {
//       setScreenWidth(
//         window.innerWidth
//       );
//     };

//     window.addEventListener(
//       "resize",
//       handleResize
//     );

//     return () =>
//       window.removeEventListener(
//         "resize",
//         handleResize
//       );
//   }, []);

//   // A room must already exist. Never silently create one from a URL.
//   useEffect(() => {
//     if (!roomCode) return undefined;
//     let mounted = true;
//     getActiveRoom(roomCode).catch((error) => {
//       if (mounted) {
//         window.alert(error.message);
//         navigate("/", { replace: true });
//       }
//     });
//     return () => { mounted = false; };
//   }, [roomCode, navigate]);

//   // LIVE PLAYER LIST AND TICKET STATUS
//   useEffect(() => {
//     if (!roomCode) {
//       setPlayers([]);
//       setPlayerCount(0);
//       return undefined;
//     }

//     const playersRef = ref(
//       db,
//       `rooms/${roomCode}/players`
//     );

//     return onValue(playersRef, (snapshot) => {
//       const data = snapshot.val();

//       // A room may initially contain players: 0. Treat that as no players.
//       // Once players join, Firebase should contain an object keyed by playerId.
//       const playerEntries =
//         data && typeof data === "object"
//           ? Object.entries(data)
//           : [];

//       const playerList = playerEntries
//         .filter(([, player]) => player && typeof player === "object")
//         .map(([id, player]) => ({
//           id,
//           name: String(player.name || player.playerName || "Unnamed Player"),
//           ticketGenerated:
//             player.ticketGenerated === true ||
//             (Array.isArray(player.tickets) && player.tickets.length > 0),
//           ticketCount: Number(player.ticketCount || 0),
//         }));

//       setPlayers(playerList);
//       setPlayerCount(playerList.length);
//     });
//   }, [roomCode]);

//   // The host may start calling numbers only after every joined player has a ticket.
//   const allPlayersHaveTickets = players.length > 0 && players.every((player) => player.ticketGenerated);
//   const pendingPlayers = players.filter((player) => !player.ticketGenerated);

//   // Live room state. Single-player mode stays local and does not require Firebase.
//   useEffect(() => {
//     if (!roomCode) return undefined;
//     const roomRef = ref(db, `rooms/${roomCode}`);
//     return onValue(roomRef, (snapshot) => {
//       const data = snapshot.val();
//       if (!data) {
//         window.alert("This room no longer exists.");
//         navigate("/", { replace: true });
//         return;
//       }
//       if (data.roomActive !== true) {
//         stopAutoPlay();
//         window.alert("This room has been closed by the host.");
//         navigate("/", { replace: true });
//         return;
//       }
//       setGenerated(data.generatedNumbers || []);
//       setCurrent(data.currentNumber ?? null);
//     });
//   }, [roomCode, navigate]);

//   const theme = {
//     background: darkMode
//       ? "#0f172a"
//       : "#ccd3e0",

//     card: darkMode
//       ? "#1e293b"
//       : "#ced5e9",

//     text: darkMode
//       ? "#f1f5f9"
//       : "#111827",

//     subText: darkMode
//       ? "#94a3b8"
//       : "#555",

//     primary: "#3b82f6",

//     numberBox: darkMode
//       ? "#334155"
//       : "#eef1f6",

//     shadow: darkMode
//       ? "0 4px 20px rgba(0,0,0,0.15)"
//       : "0 6px 20px rgba(0,0,0,0.20)",
//   };

//   const lastTen =
//     generated
//       .slice(-10)
//       .reverse();

//   // SPEAK NUMBER
//   const speakNumber = (
//     num
//   ) => {
//     if (!soundOn) return;

//     window.speechSynthesis.cancel();

//     let speechText = "";

//     if (
//       num >= 1 &&
//       num <= 9
//     ) {
//       const words = [
//         "",
//         "one",
//         "two",
//         "three",
//         "four",
//         "five",
//         "six",
//         "seven",
//         "eight",
//         "nine",
//       ];

//       speechText = `number ${words[num]}`;
//     } else {
//       const digits = num
//         .toString()
//         .split("")
//         .join(" ");

//       speechText = `${digits} ... ${num}`;
//     }

//     const msg =
//       new SpeechSynthesisUtterance(
//         speechText
//       );

//     msg.rate = 0.75;

//     const voices =
//       window.speechSynthesis.getVoices();

//     msg.voice =
//       voices.find(
//         (v) =>
//           v.lang ===
//           "en-IN"
//       ) ||
//       voices.find((v) =>
//         v.lang.startsWith(
//           "en"
//         )
//       ) ||
//       voices[0];

//     window.speechSynthesis.speak(
//       msg
//     );
//   };

//   // Generate locally in single-player; use a Firebase transaction in a room
//   // so two caller tabs cannot publish the same next number concurrently.
//   const generateNumber = async () => {
//     if (roomCode && !allPlayersHaveTickets) {
//       stopAutoPlay();
//       const message = players.length === 0
//         ? "No players have joined this room yet."
//         : `Waiting for tickets from: ${pendingPlayers.map((player) => player.name).join(", ")}`;
//       window.alert(message);
//       return;
//     }
//     try {
//       if (roomCode) {
//         const next = await publishNextNumber(roomCode);
//         if (next !== null) speakNumber(next);
//         return;
//       }
//       setGenerated((previous) => {
//         if (previous.length >= 90) return previous;
//         const remaining = numbers.filter((number) => !previous.includes(number));
//         const next = remaining[Math.floor(Math.random() * remaining.length)];
//         const updated = [...previous, next];
//         setCurrent(next);
//         speakNumber(next);
//         return updated;
//       });
//     } catch (error) {
//       stopAutoPlay();
//       window.alert(error.message || "Unable to generate number.");
//     }
//   };

//   // AUTO PLAY
//   const startAutoPlay =
//     () => {
//       if (roomCode && !allPlayersHaveTickets) {
//         const message = players.length === 0
//           ? "No players have joined this room yet."
//           : `Waiting for tickets from: ${pendingPlayers.map((player) => player.name).join(", ")}`;
//         window.alert(message);
//         return;
//       }
//       if (
//         intervalRef.current
//       )
//         return;

//       intervalRef.current =
//         setInterval(
//           generateNumber,
//           intervalTime
//         );

//       setAutoPlay(true);
//     };

//   const stopAutoPlay =
//     () => {
//       clearInterval(
//         intervalRef.current
//       );

//       intervalRef.current =
//         null;

//       setAutoPlay(false);
//     };

//   useEffect(() => {
//     if (autoPlay) {
//       stopAutoPlay();

//       startAutoPlay();
//     }
//   }, [intervalTime]);

//   useEffect(() => {
//     return () =>
//       clearInterval(
//         intervalRef.current
//       );
//   }, []);

//   // RESET GAME
//   const resetGame = async () => {
//     stopAutoPlay();
//     if (roomCode) {
//       try {
//         await resetRoomNumbers(roomCode);
//       } catch (error) {
//         window.alert(error.message || "Unable to reset the room.");
//         return;
//       }
//     } else {
//       setGenerated([]);
//       setCurrent(null);
//     }
//     window.speechSynthesis.cancel();
//   };

//   const cardStyle = {
//     background: theme.card,

//     borderRadius: "16px",

//     padding: "20px",

//     boxShadow:
//       theme.shadow,

//     color: theme.text,
//   };

//   return (
//     <div
//       style={{
//         display: "flex",

//         flexDirection:
//           screenWidth < 900
//             ? "column"
//             : "row",

//         gap: "20px",

//         padding:
//           screenWidth < 600
//             ? "10px"
//             : "20px",

//         background:
//           theme.background,

//         minHeight:
//           "100vh",

//         overflowX:
//           "hidden",
//       }}
//     >
//       {/* LEFT */}
//       <div
//         style={{
//           width:
//             screenWidth <
//             900
//               ? "100%"
//               : "300px",

//           ...cardStyle,

//           textAlign:
//             "center",
//         }}
//       >
//         <p
//           style={{
//             color:
//               theme.subText,
//           }}
//         >
//           Current Number
//         </p>

//         <div
//           style={{
//             width:
//               screenWidth <
//               600
//                 ? "100px"
//                 : "125px",

//             height:
//               screenWidth <
//               600
//                 ? "100px"
//                 : "125px",

//             margin:
//               "20px auto",

//             borderRadius:
//               "50%",

//             background:
//               theme.primary,

//             color:
//               "white",

//             fontSize:
//               screenWidth <
//               600
//                 ? "32px"
//                 : "40px",

//             display:
//               "flex",

//             alignItems:
//               "center",

//             justifyContent:
//               "center",
//           }}
//         >
//           {current || "-"}
//         </div>

//         <p>
//           Room Code:
//           <b>
//             {" "}
//             {roomCode}
//           </b>
//         </p>

//         <p>
//           Players Joined:
//           <b>
//             {" "}
//             {playerCount}
//           </b>
//         </p>

//         {roomCode && (
//           <div
//             style={{
//               marginTop: "14px",
//               marginBottom: "12px",
//               padding: "12px",
//               borderRadius: "10px",
//               background: theme.numberBox,
//               color: theme.text,
//               textAlign: "left",
//               maxHeight: "220px",
//               overflowY: "auto",
//             }}
//           >
//             <h3 style={{ margin: "0 0 10px", fontSize: "16px" }}>
//               Player Ticket Status
//             </h3>

//             {players.length === 0 ? (
//               <p style={{ margin: 0, color: theme.subText }}>
//                 No players have joined yet.
//               </p>
//             ) : (
//               players.map((player) => (
//                 <div
//                   key={player.id}
//                   style={{
//                     display: "flex",
//                     justifyContent: "space-between",
//                     alignItems: "center",
//                     gap: "8px",
//                     padding: "8px 0",
//                     borderBottom: `1px solid ${darkMode ? "#475569" : "#cbd5e1"}`,
//                     fontSize: "13px",
//                   }}
//                 >
//                   <span style={{ fontWeight: 600, overflowWrap: "anywhere" }}>
//                     {player.name}
//                   </span>
//                   <span
//                     style={{
//                       flexShrink: 0,
//                       color: player.ticketGenerated ? "#16a34a" : "#dc2626",
//                       fontWeight: 700,
//                     }}
//                   >
//                     {player.ticketGenerated
//                       ? `Ticket Generated${player.ticketCount ? ` (${player.ticketCount})` : ""}`
//                       : "Ticket Pending"}
//                   </span>
//                 </div>
//               ))
//             )}
//           </div>
//         )}

//         {roomCode && (
//           <p style={{
//             margin: "8px 0 12px",
//             color: allPlayersHaveTickets ? "#16a34a" : "#f59e0b",
//             fontSize: "13px",
//             fontWeight: 700,
//           }}>
//             {allPlayersHaveTickets
//               ? "All players have generated tickets. You can start the game."
//               : players.length === 0
//                 ? "Waiting for players to join..."
//                 : `Waiting for ${pendingPlayers.length} player(s) to generate tickets. Number caller is locked.`}
//           </p>
//         )}

//         <button
//           onClick={
//             generateNumber
//           }
//           disabled={
//             autoPlay || (Boolean(roomCode) && !allPlayersHaveTickets)
//           }
//           style={{
//             width: "100%",
//             padding:
//               "12px",
//             marginTop:
//               "10px",
//             background:
//               "green",
//             color:
//               "white",
//             borderRadius:
//               "8px",
//             border:
//               "none",
//             cursor: (autoPlay || (Boolean(roomCode) && !allPlayersHaveTickets)) ? "not-allowed" : "pointer",
//             opacity: (Boolean(roomCode) && !allPlayersHaveTickets) ? 0.55 : 1,
//           }}
//         >
//           Generate Number
//         </button>

//         <button
//           onClick={
//             autoPlay
//               ? stopAutoPlay
//               : startAutoPlay
//           }
//           disabled={Boolean(roomCode) && !allPlayersHaveTickets && !autoPlay}
//           style={{
//             width: "100%",
//             padding:
//               "12px",
//             marginTop:
//               "10px",
//             background:
//               "#555",
//             color:
//               "white",
//             borderRadius:
//               "8px",
//             border:
//               "none",
//             cursor: (Boolean(roomCode) && !allPlayersHaveTickets && !autoPlay) ? "not-allowed" : "pointer",
//             opacity: (Boolean(roomCode) && !allPlayersHaveTickets && !autoPlay) ? 0.55 : 1,
//           }}
//         >
//           {autoPlay
//             ? "Pause Auto"
//             : "Start Auto"}
//         </button>

//         <button
//           onClick={
//             resetGame
//           }
//           style={{
//             width: "100%",
//             padding:
//               "12px",
//             marginTop:
//               "10px",
//             background:
//               "red",
//             color:
//               "white",
//             borderRadius:
//               "8px",
//             border:
//               "none",
//           }}
//         >
//           Reset
//         </button>

//         <p
//           style={{
//             marginTop:
//               "15px",
//             color:
//               theme.subText,
//           }}
//         >
//           Numbers Generated:
//           {generated.length} /
//           90
//         </p>

//         <label>
//           <input
//             type="checkbox"
//             checked={
//               soundOn
//             }
//             onChange={() =>
//               setSoundOn(
//                 !soundOn
//               )
//             }
//           />
//           Sound On
//         </label>

//         <div
//           style={{
//             marginTop:
//               "15px",
//           }}
//         >
//           <p>
//             Speed:
//             {intervalTime /
//               1000}
//             s
//           </p>

//           <input
//             type="range"
//             min="2000"
//             max="8000"
//             step="500"
//             value={
//               intervalTime
//             }
//             onChange={(e) =>
//               setIntervalTime(
//                 Number(
//                   e.target
//                     .value
//                 )
//               )
//             }
//             style={{
//               width: "100%",
//             }}
//           />
//         </div>

//         {/* LAST 10 */}
//         <h4
//           style={{
//             marginTop:
//               "20px",
//           }}
//         >
//           Last 10 Numbers
//         </h4>

//         <div
//           style={{
//             display:
//               "flex",
//             gap: "10px",
//             justifyContent:
//               "center",
//             flexWrap:
//               "wrap",
//           }}
//         >
//           {lastTen.map(
//             (
//               num,
//               index
//             ) => (
//               <div
//                 key={index}
//                 style={{
//                   width:
//                     "40px",
//                   height:
//                     "40px",
//                   borderRadius:
//                     "50%",
//                   background:
//                     index ===
//                     0
//                       ? theme.primary
//                       : theme.numberBox,
//                   color:
//                     index ===
//                     0
//                       ? "white"
//                       : theme.text,
//                   display:
//                     "flex",
//                   alignItems:
//                     "center",
//                   justifyContent:
//                     "center",
//                 }}
//               >
//                 {num}
//               </div>
//             )
//           )}
//         </div>
//       </div>

//       {/* RIGHT */}
//       <div
//         style={{
//           flex: 1,
//           ...cardStyle,
//         }}
//       >
//         <div
//           style={{
//             display:
//               "flex",
//             justifyContent:
//               "space-between",
//             alignItems:
//               "center",
//             marginBottom:
//               "20px",
//             flexWrap:
//               "wrap",
//             gap: "10px",
//           }}
//         >
//           <h2>
//             Tambola Number
//             Generator
//           </h2>

//           <div
//             style={{
//               display:
//                 "flex",
//               gap: "10px",
//             }}
//           >
//             <button
//               onClick={() =>
//                 navigate("/")
//               }
//             >
//               Home
//             </button>

//             <button
//               onClick={() =>
//                 setDarkMode(
//                   !darkMode
//                 )
//               }
//             >
//               {darkMode
//                 ? "Light"
//                 : "Dark"}
//             </button>
//           </div>
//         </div>

//         {/* GRID */}
//         <div
//           style={{
//             display:
//               "grid",

//             gridTemplateColumns:
//               screenWidth <
//               500
//                 ? "repeat(4,1fr)"
//                 : screenWidth <
//                   800
//                 ? "repeat(6,1fr)"
//                 : "repeat(10,1fr)",

//             gap:
//               screenWidth <
//               600
//                 ? "8px"
//                 : "12px",
//           }}
//         >
//           {numbers.map(
//             (num) => {
//               const isSelected =
//                 generated.includes(
//                   num
//                 );

//               return (
//                 <div
//                   key={num}
//                   style={{
//                     padding:
//                       screenWidth <
//                       600
//                         ? "10px"
//                         : "12px",

//                     textAlign:
//                       "center",

//                     borderRadius:
//                       "10px",

//                     background:
//                       isSelected
//                         ? theme.primary
//                         : theme.numberBox,

//                     color:
//                       isSelected
//                         ? "white"
//                         : theme.text,

//                     transform:
//                       isSelected
//                         ? "scale(1.05)"
//                         : "scale(1)",
//                   }}
//                 >
//                   {num}
//                 </div>
//               );
//             }
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }


import React, {
  useState,
  useEffect,
  useRef,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import { onValue, ref } from "firebase/database";
import { db } from "../firebase";
import { getActiveRoom, publishNextNumber, resetRoomNumbers } from "../services/roomService";


// DUPLICATE TAB DETECTION
function useDuplicateTabRedirect() {
  useEffect(() => {
    const STORAGE_KEY = "tambola_tab_id";
    const CHANNEL_NAME = "tambola_tab_channel";

    let tabId = sessionStorage.getItem(STORAGE_KEY);

    if (!tabId) {
      tabId = crypto.randomUUID();
      sessionStorage.setItem(STORAGE_KEY, tabId);
    }

    if (!("BroadcastChannel" in window)) {
      console.warn("BroadcastChannel is not supported.");
      return;
    }

    const channel = new BroadcastChannel(CHANNEL_NAME);

    const requestId = crypto.randomUUID();
    let duplicateDetected = false;

    channel.onmessage = (event) => {
      const message = event.data;

      // Existing tab responds to the duplicate tab
      if (
        message.type === "CHECK_TAB" &&
        message.tabId === tabId
      ) {
        channel.postMessage({
          type: "TAB_EXISTS",
          tabId: tabId,
          requestId: message.requestId,
        });
      }

      // Duplicate tab receives the response
      if (
        message.type === "TAB_EXISTS" &&
        message.requestId === requestId
      ) {
        duplicateDetected = true;

        // Give the duplicate a new identity
        sessionStorage.setItem(
          STORAGE_KEY,
          crypto.randomUUID()
        );

        window.location.replace("/");
      }
    };

    // Check whether another tab already has this identity
    const timer = setTimeout(() => {
      if (!duplicateDetected) {
        channel.postMessage({
          type: "CHECK_TAB",
          tabId: tabId,
          requestId: requestId,
        });
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      channel.close();
    };
  }, []);
}

export default function NumberGenerator() {


   useDuplicateTabRedirect();
  
  const numbers = Array.from(
    { length: 90 },
    (_, i) => i + 1
  );

  const navigate = useNavigate();

  const { roomCode } = useParams();
  

  const intervalRef = useRef(null);

  const [generated, setGenerated] =
    useState([]);

  const [current, setCurrent] =
    useState(null);

  const [playerCount,
    setPlayerCount] =
    useState(0);

  const [players, setPlayers] = useState([]);

  const [autoPlay,
    setAutoPlay] =
    useState(false);

  const [intervalTime,
    setIntervalTime] =
    useState(3000);

  const [soundOn,
    setSoundOn] =
    useState(true);

  const [darkMode,
    setDarkMode] =
    useState(() => {
      const saved =
        localStorage.getItem(
          "theme"
        );

      return saved
        ? JSON.parse(saved)
        : true;
    });

  const [screenWidth,
    setScreenWidth] =
    useState(window.innerWidth);

  // THEME SAVE
  useEffect(() => {
    localStorage.setItem(
      "theme",
      JSON.stringify(darkMode)
    );
  }, [darkMode]);

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

  // A room must already exist. Never silently create one from a URL.
  useEffect(() => {
    if (!roomCode) return undefined;
    let mounted = true;
    getActiveRoom(roomCode).catch((error) => {
      if (mounted) {
        window.alert(error.message);
        navigate("/", { replace: true });
      }
    });
    return () => { mounted = false; };
  }, [roomCode, navigate]);

  // LIVE PLAYER LIST AND TICKET STATUS
  useEffect(() => {
    if (!roomCode) {
      setPlayers([]);
      setPlayerCount(0);
      return undefined;
    }

    const playersRef = ref(
      db,
      `rooms/${roomCode}/players`
    );

    return onValue(playersRef, (snapshot) => {
      const data = snapshot.val();

      // A room may initially contain players: 0. Treat that as no players.
      // Once players join, Firebase should contain an object keyed by playerId.
      const playerEntries =
        data && typeof data === "object"
          ? Object.entries(data)
          : [];

      const playerList = playerEntries
        .filter(([, player]) => player && typeof player === "object")
        .map(([id, player]) => ({
          id,
          name: String(player.name || player.playerName || "Unnamed Player"),
          dropped: player.status === "dropped" || player.dropped === true || Boolean(player.droppedAt),
          ticketGenerated:
            player.ticketGenerated === true ||
            (Array.isArray(player.tickets) && player.tickets.length > 0),
          ticketCount: Number(player.ticketCount || 0),
        }));

      const activePlayers = playerList.filter((player) => !player.dropped);
      setPlayers(playerList);
      setPlayerCount(activePlayers.length);
    });
  }, [roomCode]);

  // Dropped players remain visible but do not block the game.
  // At least two active players must have tickets before calling starts.
  const activePlayers = players.filter((player) => !player.dropped);
  const allPlayersHaveTickets =
    activePlayers.length >= 2 && activePlayers.every((player) => player.ticketGenerated);
  const pendingPlayers = activePlayers.filter((player) => !player.ticketGenerated);

  // Live room state. Single-player mode stays local and does not require Firebase.
  useEffect(() => {
    if (!roomCode) return undefined;
    const roomRef = ref(db, `rooms/${roomCode}`);
    return onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        window.alert("This room no longer exists.");
        navigate("/", { replace: true });
        return;
      }
      if (data.roomActive !== true) {
        stopAutoPlay();
        window.alert("This room has been closed by the host.");
        navigate("/", { replace: true });
        return;
      }
      setGenerated(data.generatedNumbers || []);
      setCurrent(data.currentNumber ?? null);
    });
  }, [roomCode, navigate]);

  const theme = {
    background: darkMode
      ? "#0f172a"
      : "#ccd3e0",

    card: darkMode
      ? "#1e293b"
      : "#ced5e9",

    text: darkMode
      ? "#f1f5f9"
      : "#111827",

    subText: darkMode
      ? "#94a3b8"
      : "#555",

    primary: "#3b82f6",

    numberBox: darkMode
      ? "#334155"
      : "#eef1f6",

    shadow: darkMode
      ? "0 4px 20px rgba(0,0,0,0.15)"
      : "0 6px 20px rgba(0,0,0,0.20)",
  };

  const lastTen =
    generated
      .slice(-10)
      .reverse();

  // SPEAK NUMBER
  const speakNumber = (
    num
  ) => {
    if (!soundOn) return;

    window.speechSynthesis.cancel();

    let speechText = "";

    if (
      num >= 1 &&
      num <= 9
    ) {
      const words = [
        "",
        "one",
        "two",
        "three",
        "four",
        "five",
        "six",
        "seven",
        "eight",
        "nine",
      ];

      speechText = `number ${words[num]}`;
    } else {
      const digits = num
        .toString()
        .split("")
        .join(" ");

      speechText = `${digits} ... ${num}`;
    }

    const msg =
      new SpeechSynthesisUtterance(
        speechText
      );

    msg.rate = 0.75;

    const voices =
      window.speechSynthesis.getVoices();

    msg.voice =
      voices.find(
        (v) =>
          v.lang ===
          "en-IN"
      ) ||
      voices.find((v) =>
        v.lang.startsWith(
          "en"
        )
      ) ||
      voices[0];

    window.speechSynthesis.speak(
      msg
    );
  };

  // Generate locally in single-player; use a Firebase transaction in a room
  // so two caller tabs cannot publish the same next number concurrently.
  const generateNumber = async () => {
    if (roomCode && !allPlayersHaveTickets) {
      stopAutoPlay();
      const message = activePlayers.length < 2
        ? `At least 2 active players are required. Currently: ${activePlayers.length}.`
        : `Waiting for tickets from: ${pendingPlayers.map((player) => player.name).join(", ")}`;
      window.alert(message);
      return;
    }
    try {
      if (roomCode) {
        const next = await publishNextNumber(roomCode);
        if (next !== null) speakNumber(next);
        return;
      }
      setGenerated((previous) => {
        if (previous.length >= 90) return previous;
        const remaining = numbers.filter((number) => !previous.includes(number));
        const next = remaining[Math.floor(Math.random() * remaining.length)];
        const updated = [...previous, next];
        setCurrent(next);
        speakNumber(next);
        return updated;
      });
    } catch (error) {
      stopAutoPlay();
      window.alert(error.message || "Unable to generate number.");
    }
  };

  // AUTO PLAY
  const startAutoPlay =
    () => {
      if (roomCode && !allPlayersHaveTickets) {
        const message = activePlayers.length < 2
          ? `At least 2 active players are required. Currently: ${activePlayers.length}.`
          : `Waiting for tickets from: ${pendingPlayers.map((player) => player.name).join(", ")}`;
        window.alert(message);
        return;
      }
      if (
        intervalRef.current
      )
        return;

      intervalRef.current =
        setInterval(
          generateNumber,
          intervalTime
        );

      setAutoPlay(true);
    };

  const stopAutoPlay =
    () => {
      clearInterval(
        intervalRef.current
      );

      intervalRef.current =
        null;

      setAutoPlay(false);
    };

  useEffect(() => {
    if (autoPlay) {
      stopAutoPlay();

      startAutoPlay();
    }
  }, [intervalTime]);

  useEffect(() => {
    return () =>
      clearInterval(
        intervalRef.current
      );
  }, []);

  // RESET GAME
  const resetGame = async () => {
    stopAutoPlay();
    if (roomCode) {
      try {
        await resetRoomNumbers(roomCode);
      } catch (error) {
        window.alert(error.message || "Unable to reset the room.");
        return;
      }
    } else {
      setGenerated([]);
      setCurrent(null);
    }
    window.speechSynthesis.cancel();
  };

  const cardStyle = {
    background: theme.card,

    borderRadius: "16px",

    padding: "20px",

    boxShadow:
      theme.shadow,

    color: theme.text,
  };

  return (
    <div
      style={{
        display: "flex",

        flexDirection:
          screenWidth < 900
            ? "column"
            : "row",

        gap: "20px",

        padding:
          screenWidth < 600
            ? "10px"
            : "20px",

        background:
          theme.background,

        minHeight:
          "100vh",

        overflowX:
          "hidden",
      }}
    >
      {/* LEFT */}
      <div
        style={{
          width:
            screenWidth <
            900
              ? "100%"
              : "300px",

          ...cardStyle,

          textAlign:
            "center",
        }}
      >
        <p
          style={{
            color:
              theme.subText,
          }}
        >
          Current Number
        </p>

        <div
          style={{
            width:
              screenWidth <
              600
                ? "100px"
                : "125px",

            height:
              screenWidth <
              600
                ? "100px"
                : "125px",

            margin:
              "20px auto",

            borderRadius:
              "50%",

            background:
              theme.primary,

            color:
              "white",

            fontSize:
              screenWidth <
              600
                ? "32px"
                : "40px",

            display:
              "flex",

            alignItems:
              "center",

            justifyContent:
              "center",
          }}
        >
          {current || "-"}
        </div>

        <p>
          Room Code:
          <b>
            {" "}
            {roomCode}
          </b>
        </p>

        <p>
          Players Joined:
          <b>
            {" "}
            {playerCount}
          </b>
        </p>

        {roomCode && (
          <div
            style={{
              marginTop: "14px",
              marginBottom: "12px",
              padding: "12px",
              borderRadius: "10px",
              background: theme.numberBox,
              color: theme.text,
              textAlign: "left",
              maxHeight: "220px",
              overflowY: "auto",
            }}
          >
            <h3 style={{ margin: "0 0 10px", fontSize: "16px" }}>
              Player Ticket Status
            </h3>

            {players.length === 0 ? (
              <p style={{ margin: 0, color: theme.subText }}>
                No players have joined yet.
              </p>
            ) : (
              players.map((player) => (
                <div
                  key={player.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 0",
                    borderBottom: `1px solid ${darkMode ? "#475569" : "#cbd5e1"}`,
                    fontSize: "13px",
                  }}
                >
                  <span style={{ fontWeight: 600, overflowWrap: "anywhere" }}>
                    {player.name}
                  </span>
                  <span
                    style={{
                      flexShrink: 0,
                      color: player.dropped ? "#f59e0b" : player.ticketGenerated ? "#16a34a" : "#dc2626",
                      fontWeight: 700,
                    }}
                  >
                    {player.dropped
                      ? "Player Dropped"
                      : player.ticketGenerated
                        ? `Ticket Generated${player.ticketCount ? ` (${player.ticketCount})` : ""}`
                        : "Ticket Pending"}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {roomCode && (
          <p style={{
            margin: "8px 0 12px",
            color: allPlayersHaveTickets ? "#16a34a" : "#f59e0b",
            fontSize: "13px",
            fontWeight: 700,
          }}>
            {allPlayersHaveTickets
              ? "All active players have generated tickets. You can start the game."
              : activePlayers.length < 2
                ? `At least 2 active players are required. Currently: ${activePlayers.length}.`
                : `Waiting for ${pendingPlayers.length} active player(s) to generate tickets. Number caller is locked.`}
          </p>
        )}

        <button
          onClick={
            generateNumber
          }
          disabled={
            autoPlay || (Boolean(roomCode) && !allPlayersHaveTickets)
          }
          style={{
            width: "100%",
            padding:
              "12px",
            marginTop:
              "10px",
            background:
              "green",
            color:
              "white",
            borderRadius:
              "8px",
            border:
              "none",
            cursor: (autoPlay || (Boolean(roomCode) && !allPlayersHaveTickets)) ? "not-allowed" : "pointer",
            opacity: (Boolean(roomCode) && !allPlayersHaveTickets) ? 0.55 : 1,
          }}
        >
          Generate Number
        </button>

        <button
          onClick={
            autoPlay
              ? stopAutoPlay
              : startAutoPlay
          }
          disabled={Boolean(roomCode) && !allPlayersHaveTickets && !autoPlay}
          style={{
            width: "100%",
            padding:
              "12px",
            marginTop:
              "10px",
            background:
              "#555",
            color:
              "white",
            borderRadius:
              "8px",
            border:
              "none",
            cursor: (Boolean(roomCode) && !allPlayersHaveTickets && !autoPlay) ? "not-allowed" : "pointer",
            opacity: (Boolean(roomCode) && !allPlayersHaveTickets && !autoPlay) ? 0.55 : 1,
          }}
        >
          {autoPlay
            ? "Pause Auto"
            : "Start Auto"}
        </button>

        <button
          onClick={
            resetGame
          }
          style={{
            width: "100%",
            padding:
              "12px",
            marginTop:
              "10px",
            background:
              "red",
            color:
              "white",
            borderRadius:
              "8px",
            border:
              "none",
          }}
        >
          Reset
        </button>

        <p
          style={{
            marginTop:
              "15px",
            color:
              theme.subText,
          }}
        >
          Numbers Generated:
          {generated.length} /
          90
        </p>

        <label>
          <input
            type="checkbox"
            checked={
              soundOn
            }
            onChange={() =>
              setSoundOn(
                !soundOn
              )
            }
          />
          Sound On
        </label>

        <div
          style={{
            marginTop:
              "15px",
          }}
        >
          <p>
            Speed:
            {intervalTime /
              1000}
            s
          </p>

          <input
            type="range"
            min="2000"
            max="8000"
            step="500"
            value={
              intervalTime
            }
            onChange={(e) =>
              setIntervalTime(
                Number(
                  e.target
                    .value
                )
              )
            }
            style={{
              width: "100%",
            }}
          />
        </div>

        {/* LAST 10 */}
        <h4
          style={{
            marginTop:
              "20px",
          }}
        >
          Last 10 Numbers
        </h4>

        <div
          style={{
            display:
              "flex",
            gap: "10px",
            justifyContent:
              "center",
            flexWrap:
              "wrap",
          }}
        >
          {lastTen.map(
            (
              num,
              index
            ) => (
              <div
                key={index}
                style={{
                  width:
                    "40px",
                  height:
                    "40px",
                  borderRadius:
                    "50%",
                  background:
                    index ===
                    0
                      ? theme.primary
                      : theme.numberBox,
                  color:
                    index ===
                    0
                      ? "white"
                      : theme.text,
                  display:
                    "flex",
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
      </div>

      {/* RIGHT */}
      <div
        style={{
          flex: 1,
          ...cardStyle,
        }}
      >
        <div
          style={{
            display:
              "flex",
            justifyContent:
              "space-between",
            alignItems:
              "center",
            marginBottom:
              "20px",
            flexWrap:
              "wrap",
            gap: "10px",
          }}
        >
          <h2>
            Tambola Number
            Generator
          </h2>

          <div
            style={{
              display:
                "flex",
              gap: "10px",
            }}
          >
            <button
              onClick={() =>
                navigate("/")
              }
            >
              Home
            </button>

            <button
              onClick={() =>
                setDarkMode(
                  !darkMode
                )
              }
            >
              {darkMode
                ? "Light"
                : "Dark"}
            </button>
          </div>
        </div>

        {/* GRID */}
        <div
          style={{
            display:
              "grid",

            gridTemplateColumns:
              screenWidth <
              500
                ? "repeat(4,1fr)"
                : screenWidth <
                  800
                ? "repeat(6,1fr)"
                : "repeat(10,1fr)",

            gap:
              screenWidth <
              600
                ? "8px"
                : "12px",
          }}
        >
          {numbers.map(
            (num) => {
              const isSelected =
                generated.includes(
                  num
                );

              return (
                <div
                  key={num}
                  style={{
                    padding:
                      screenWidth <
                      600
                        ? "10px"
                        : "12px",

                    textAlign:
                      "center",

                    borderRadius:
                      "10px",

                    background:
                      isSelected
                        ? theme.primary
                        : theme.numberBox,

                    color:
                      isSelected
                        ? "white"
                        : theme.text,

                    transform:
                      isSelected
                        ? "scale(1.05)"
                        : "scale(1)",
                  }}
                >
                  {num}
                </div>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
}