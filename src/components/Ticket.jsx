import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { onValue, ref, remove, runTransaction, update } from "firebase/database";
import { db } from "../firebase";
import { getActiveRoom, joinRoom, normalizeRoomCode, dropPlayer } from "../services/roomService";




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

const pageStyle = {
  background: "radial-gradient(circle at 15% 10%, #243b60 0%, #111827 42%, #080d18 100%)",
  minHeight: "100vh", padding: "30px", color: "#f8fafc",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif",
  boxSizing: "border-box",
};
const buttonStyle = {
  padding: "12px 20px", borderRadius: "12px",
  border: "1px solid rgba(255,255,255,.18)",
  color: "white", cursor: "pointer", fontWeight: "650",
  boxShadow: "0 8px 24px rgba(0,0,0,.18)",
  backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
};

function shuffle(values) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function combinations(values, size) {
  if (size === 1) return values.map((value) => [value]);
  const result = [];
  for (let i = 0; i <= values.length - size; i += 1) {
    combinations(values.slice(i + 1), size - 1).forEach((combo) => {
      result.push([values[i], ...combo]);
    });
  }
  return result;
}

// Standard Tambola ticket: 3 rows x 9 columns, 5 numbers per row.
function createTicket() {
  for (let attempt = 0; attempt < 500; attempt += 1) {
    const columnCounts = Array(9).fill(1);
    let extra = 6;
    for (const column of shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8])) {
      if (extra === 0) break;
      const add = Math.min(2, extra, 3 - columnCounts[column]);
      const actual = add === 2 ? (Math.random() < 0.5 ? 1 : 2) : add;
      columnCounts[column] += actual;
      extra -= actual;
    }
    if (extra !== 0) continue;

    const occupied = Array.from({ length: 3 }, () => Array(9).fill(false));
    const rowCounts = [0, 0, 0];
    const assign = (column) => {
      if (column === 9) return rowCounts.every((count) => count === 5);
      for (const rows of shuffle(combinations([0, 1, 2], columnCounts[column]))) {
        if (!rows.every((row) => rowCounts[row] < 5)) continue;
        rows.forEach((row) => { occupied[row][column] = true; rowCounts[row] += 1; });
        if (assign(column + 1)) return true;
        rows.forEach((row) => { occupied[row][column] = false; rowCounts[row] -= 1; });
      }
      return false;
    };
    if (!assign(0)) continue;

    const ranges = [[1, 9], [10, 19], [20, 29], [30, 39], [40, 49], [50, 59], [60, 69], [70, 79], [80, 90]];
    const ticket = Array.from({ length: 3 }, () => Array(9).fill(null));
    for (let column = 0; column < 9; column += 1) {
      const [min, max] = ranges[column];
      const nums = shuffle(Array.from({ length: max - min + 1 }, (_, index) => min + index))
        .slice(0, columnCounts[column]).sort((a, b) => a - b);
      let index = 0;
      for (let row = 0; row < 3; row += 1) {
        if (occupied[row][column]) ticket[row][column] = nums[index++];
      }
    }
    return ticket;
  }
  throw new Error("Unable to generate a ticket. Please try again.");
}

// Firebase may contain tickets saved by an older version of the app.
// Only restore tickets that match the standard 3 x 9 Tambola structure.
function isValidTambolaTicket(ticket) {
  if (!Array.isArray(ticket) || ticket.length !== 3) return false;

  const columnRanges = [
    [1, 9], [10, 19], [20, 29], [30, 39], [40, 49],
    [50, 59], [60, 69], [70, 79], [80, 90],
  ];

  let totalNumbers = 0;
  const previousNumberByColumn = Array(9).fill(null);

  for (let rowIndex = 0; rowIndex < 3; rowIndex += 1) {
    const row = ticket[rowIndex];
    if (!Array.isArray(row) || row.length !== 9) return false;

    let numbersInRow = 0;

    for (let columnIndex = 0; columnIndex < 9; columnIndex += 1) {
      const value = row[columnIndex];
      if (value === null || value === undefined || value === "") continue;

      if (!Number.isInteger(value)) return false;
      const [min, max] = columnRanges[columnIndex];
      if (value < min || value > max) return false;

      const previous = previousNumberByColumn[columnIndex];
      if (previous !== null && value <= previous) return false;
      previousNumberByColumn[columnIndex] = value;

      numbersInRow += 1;
      totalNumbers += 1;
    }

    if (numbersInRow !== 5) return false;
  }

  return totalNumbers === 15;
}

function toIndexedArray(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") {
    const keys = Object.keys(value);
    if (keys.length && keys.every((key) => /^\d+$/.test(key))) {
      return keys
        .sort((a, b) => Number(a) - Number(b))
        .map((key) => value[key]);
    }
  }
  return null;
}

// Firebase Realtime Database can represent sparse arrays as objects because
// null children are omitted. Store blank cells as empty strings and normalize
// them back to null when restoring the ticket for the UI.
function normalizeFirebaseTicket(ticketValue) {
  const rows = toIndexedArray(ticketValue);
  if (!rows || rows.length !== 3) return null;

  const normalizedRows = rows.map((rowValue) => {
    const row = toIndexedArray(rowValue);
    if (!row || row.length !== 9) return null;
    return row.map((cell) => cell === "" || cell === undefined ? null : cell);
  });

  if (normalizedRows.some((row) => row === null)) return null;
  return normalizedRows;
}

function normalizeFirebaseTickets(ticketsValue) {
  const savedTickets = toIndexedArray(ticketsValue);
  if (!savedTickets || savedTickets.length === 0) return [];
  return savedTickets.map(normalizeFirebaseTicket);
}

function areValidTambolaTickets(tickets) {
  return Array.isArray(tickets) &&
    tickets.length > 0 &&
    tickets.every(isValidTambolaTicket);
}

function CelebrationScreen({ claims, roomCode, onHome }) {
  const requiredPrizes = ["jaldi5", "firstLine", "secondLine", "lastLine", "fullHouse"];
  const labels = {
    jaldi5: "Jaldi 5",
    firstLine: "First Line",
    secondLine: "Second Line",
    lastLine: "Last Line",
    fullHouse: "Full House",
  };
  const winners = requiredPrizes
    .map((key) => ({ key, ...(claims?.[key] || {}) }))
    .filter((claim) => claim.playerName || claim.playerId);

  // return (
    // <div className="tambola-celebration-page">
    //   <style>{`
    //     .tambola-celebration-page{min-height:100vh;box-sizing:border-box;padding:28px 16px;background:radial-gradient(circle at top,#263b68 0%,#111827 48%,#080d1b 100%);color:#fff;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;font-family:Arial,sans-serif;text-align:center}
    //     .tambola-celebration-card{width:min(760px,100%);padding:34px 24px;border-radius:24px;background:rgba(30,41,59,.94);box-shadow:0 20px 70px rgba(0,0,0,.45);position:relative;z-index:2;border:1px solid rgba(255,255,255,.12)}
    //     .tambola-trophy{font-size:64px;animation:tambolaBounce 1.3s infinite alternate}
    //     .tambola-winner-row{display:flex;align-items:center;justify-content:space-between;gap:12px;text-align:left;padding:14px 16px;margin:10px 0;background:#0f172a;border-radius:12px;border-left:4px solid #22c55e}
    //     .tambola-confetti{position:absolute;inset:-20px;pointer-events:none;overflow:hidden;z-index:1}
    //     .tambola-confetti i{position:absolute;top:-12%;width:9px;height:16px;border-radius:2px;background:hsl(var(--hue),90%,60%);left:var(--left);animation: tambolaFall var(--duration) linear infinite;animation-delay:var(--delay);transform:rotate(var(--rotation))}
    //     @keyframes tambolaFall{to{transform:translate3d(var(--drift),115vh,0) rotate(900deg)}}
    //     @keyframes tambolaBounce{to{transform:translateY(-12px) rotate(5deg)}}
    //     @media(max-width:520px){.tambola-celebration-card{padding:26px 15px}.tambola-winner-row{align-items:flex-start;flex-direction:column}}

        
    //   `}</style>
    //   <div className="tambola-confetti" aria-hidden="true">
    //     {Array.from({ length: 70 }, (_, index) => (
    //       <i key={index} style={{
    //         "--left": `${(index * 37) % 100}%`,
    //         "--hue": `${(index * 47) % 360}`,
    //         "--duration": `${4 + (index % 6)}s`,
    //         "--delay": `${-(index % 9)}s`,
    //         "--rotation": `${index * 29}deg`,
    //         "--drift": `${(index % 2 ? 1 : -1) * (20 + (index % 80))}px`,
    //       }} />
    //     ))}
    //   </div>
    //   <section className="tambola-celebration-card">
    //     <div className="tambola-trophy">🏆</div>
    //     <p style={{ color: "#86efac", fontWeight: 800, letterSpacing: 3, marginBottom: 8 }}>GAME COMPLETED</p>
    //     <h1 style={{ fontSize: "clamp(32px,6vw,54px)", margin: "8px 0", color: "#facc15" }}>Congratulations!</h1>
    //     <p style={{ color: "#cbd5e1", fontSize: 17, marginTop: 0 }}>All five Tambola prizes have been claimed.</p>
    //     {roomCode && <p style={{ color: "#94a3b8" }}>Room Code: <strong>{roomCode}</strong></p>}
    //     <h2 style={{ margin: "28px 0 14px" }}>🎉 Winners 🎉</h2>
    //     {winners.map((winner) => (
    //       <div className="tambola-winner-row" key={winner.key}>
    //         <strong style={{ color: "#86efac" }}>🏆 {winner.prizeName || labels[winner.key]}</strong>
    //         <span><strong>{winner.playerName || "Winner"}</strong> <span style={{ color: "#94a3b8" }}>(Ticket {(winner.ticketIndex ?? 0) + 1})</span></span>
    //       </div>
    //     ))}
    //     <button onClick={onHome} style={{ marginTop: 24, padding: "13px 34px", border: 0, borderRadius: 10, background: "#16a34a", color: "white", fontWeight: 800, fontSize: 16, cursor: "pointer" }}>Home</button>
    //   </section>
    // </div>

    
  // );

  return (
  <div className="glass-page tambola-celebration-page">
    <style>{`
      .tambola-celebration-page {
        min-height: 100vh;
        box-sizing: border-box;
        padding: 28px 16px;
        background: transparent;
        color: var(--fg);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;
        font-family: Inter, sans-serif;
        text-align: center;
      }

      .tambola-celebration-card {
        width: min(760px, 100%);
        padding: 34px 24px;
        border-radius: 26px;
        background: var(--glass);
        border: 1px solid var(--glass-border);
        box-shadow:
          var(--shadow),
          inset 0 2px 3px rgba(255,255,255,.3);
        backdrop-filter: blur(30px) saturate(180%);
        -webkit-backdrop-filter: blur(30px) saturate(180%);
        position: relative;
        z-index: 2;
      }

      :root[data-theme="light"] .tambola-celebration-card {
        background: linear-gradient(
          135deg,
          rgba(255,255,255,.85),
          rgba(255,255,255,.48),
          rgba(210,228,255,.55)
        );
        border: 1px solid rgba(255,255,255,.9);
        box-shadow:
          0 22px 60px rgba(42,58,85,.15),
          inset 0 2px 4px rgba(255,255,255,.95);
      }

      .tambola-trophy {
        font-size: 64px;
        animation: tambolaBounce 1.3s infinite alternate;
      }

      .tambola-winner-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        text-align: left;
        padding: 14px 16px;
        margin: 10px 0;
        background: var(--glass-strong);
        color: var(--fg);
        border: 1px solid var(--glass-border);
        border-radius: 14px;
        border-left: 4px solid #22c55e;
        box-shadow: inset 0 1px 2px rgba(255,255,255,.2);
        backdrop-filter: blur(16px);
      }

      .tambola-confetti {
        position: absolute;
        inset: -20px;
        pointer-events: none;
        overflow: hidden;
        z-index: 1;
      }

      .tambola-confetti i {
        position: absolute;
        top: -12%;
        width: 9px;
        height: 16px;
        border-radius: 2px;
        background: hsl(var(--hue),90%,60%);
        left: var(--left);
        animation: tambolaFall var(--duration) linear infinite;
        animation-delay: var(--delay);
        transform: rotate(var(--rotation));
      }

      @keyframes tambolaFall {
        to {
          transform: translate3d(var(--drift),115vh,0) rotate(900deg);
        }
      }

      @keyframes tambolaBounce {
        to {
          transform: translateY(-12px) rotate(5deg);
        }
      }

      @media(max-width:520px) {
        .tambola-celebration-card {
          padding: 26px 15px;
        }

        .tambola-winner-row {
          align-items: flex-start;
          flex-direction: column;
        }
      }
    `}</style>

    <div className="tambola-confetti" aria-hidden="true">
      {Array.from({ length: 70 }, (_, index) => (
        <i
          key={index}
          style={{
            "--left": `${(index * 37) % 100}%`,
            "--hue": `${(index * 47) % 360}`,
            "--duration": `${4 + (index % 6)}s`,
            "--delay": `${-(index % 9)}s`,
            "--rotation": `${index * 29}deg`,
            "--drift": `${(index % 2 ? 1 : -1) * (20 + (index % 80))}px`,
          }}
        />
      ))}
    </div>

    <section className="tambola-celebration-card">
      <div className="tambola-trophy">🏆</div>

      <p style={{
        color: "#16a34a",
        fontWeight: 800,
        letterSpacing: 3,
        marginBottom: 8
      }}>
        GAME COMPLETED
      </p>

      <h1 style={{
        fontSize: "clamp(32px,6vw,54px)",
        margin: "8px 0",
        color: "#eab308"
      }}>
        Congratulations!
      </h1>

      <p style={{
        color: "var(--muted)",
        fontSize: 17,
        marginTop: 0
      }}>
        All five Tambola prizes have been claimed.
      </p>

      {roomCode && (
        <p style={{ color: "var(--muted)" }}>
          Room Code: <strong>{roomCode}</strong>
        </p>
      )}

      <h2 style={{ margin: "28px 0 14px" }}>
        🎉 Winners 🎉
      </h2>

      {winners.map((winner) => (
        <div className="tambola-winner-row" key={winner.key}>
          <strong style={{ color: "#16a34a" }}>
            🏆 {winner.prizeName || labels[winner.key]}
          </strong>

          <span>
            <strong>{winner.playerName || "Winner"}</strong>{" "}
            <span style={{ color: "var(--muted)" }}>
              (Ticket {(winner.ticketIndex ?? 0) + 1})
            </span>
          </span>
        </div>
      ))}

      <button
        onClick={onHome}
        style={{
          marginTop: 24,
          padding: "13px 34px",
          border: "1px solid rgba(255,255,255,.25)",
          borderRadius: 12,
          background: "#16a34a",
          color: "white",
          fontWeight: 800,
          fontSize: 16,
          cursor: "pointer",
          boxShadow: "0 8px 24px rgba(22,163,74,.25)"
        }}
      >
        Home
      </button>
    </section>
  </div>
);
}

export default function Ticket() {


   useDuplicateTabRedirect(); 
   
  const navigate = useNavigate();
  const { roomCode: routeRoomCode } = useParams();
  const [mode, setMode] = useState(routeRoomCode ? "join" : null);
  const [roomCodeInput, setRoomCodeInput] = useState(routeRoomCode || "");
  const [playerName, setPlayerName] = useState("");
  const [playerId, setPlayerId] = useState(
    () => localStorage.getItem("tambolaPlayerId") || ""
  );
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [roomCode, setRoomCode] = useState(routeRoomCode || "");
  const [roomActive, setRoomActive] = useState(true);
  const [roomGameStarted, setRoomGameStarted] = useState(false);
  const [generatedNumbers, setGeneratedNumbers] = useState([]);
  const [claims, setClaims] = useState({});
  const REQUIRED_PRIZES = ["jaldi5", "firstLine", "secondLine", "lastLine", "fullHouse"];
  const isGameCompleted = mode === "tickets" && Boolean(roomCode) && REQUIRED_PRIZES.every((key) => Boolean(claims?.[key]));
  const [claimingPrize, setClaimingPrize] = useState("");
  const [tickets, setTickets] = useState([]);
  const [marked, setMarked] = useState([]);
  const [count, setCount] = useState(1);
  const [gameStarted, setGameStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  useEffect(() => {
    const resize = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // Restore this browser's room session after refresh, but never assume an arbitrary URL is valid.
  useEffect(() => {
    if (!routeRoomCode) return;
    const savedCode = localStorage.getItem("tambolaRoomCode");
    const savedPlayer = localStorage.getItem("tambolaPlayerId");
    if (savedCode === routeRoomCode && savedPlayer) {
      getActiveRoom(routeRoomCode).then(() => {
        setPlayerId(savedPlayer);
        setPlayerName(localStorage.getItem("tambolaPlayerName") || "");
        setRoomCode(routeRoomCode);
        setMode("tickets");
      }).catch((joinError) => setError(joinError.message));
    }
  }, [routeRoomCode]);

  useEffect(() => {
    if (!roomCode || mode !== "tickets") return undefined;
    const roomRef = ref(db, `rooms/${roomCode}`);
    return onValue(roomRef, (snapshot) => {
      const room = snapshot.val();
      if (!room) {
        setRoomActive(false);
        setError("This room no longer exists.");
        return;
      }
      const calledNumbers = Array.isArray(room.generatedNumbers)
        ? room.generatedNumbers
        : [];
      const locked = room.gameStarted === true || calledNumbers.length > 0;

      setRoomActive(room.roomActive === true);
      setRoomGameStarted(locked);
      setGeneratedNumbers(calledNumbers);
      setClaims(room.claims && typeof room.claims === "object" ? room.claims : {});
      const savedPlayer = room.players && room.players[playerId];
      if (savedPlayer) {
        const savedTickets = normalizeFirebaseTickets(savedPlayer.tickets);

        if (areValidTambolaTickets(savedTickets)) {
          setTickets(savedTickets);
          setGameStarted(true);
          setMarked((previous) => previous.filter((number) =>
            savedTickets.some((ticket) => ticket.flat().includes(number))
          ));
          setError("");
        } else if (savedPlayer.tickets) {
          // Do not silently display legacy/flattened ticket data.
          setTickets([]);
          setMarked([]);
          setGameStarted(false);
          setError(locked
            ? "Your saved ticket format is invalid. Ask the host to reset the game before generating a replacement ticket."
            : "Your saved ticket format is outdated. Please generate new tickets.");
        } else if (!locked) {
          // Player has not generated tickets yet; keep the Generate Tickets action available.
          setTickets([]);
          setGameStarted(false);
        }
      }

      if (room.roomActive !== true) {
        setError("This room has been closed by the host.");
      } else if (locked) {
        setError("The game has already started. Ticket generation and new joins are closed.");
      }
    });
  }, [roomCode, mode, playerId]);

  const lastTen = useMemo(() => generatedNumbers.slice(-10).reverse(), [generatedNumbers]);

  const handleJoin = async () => {
    setError("");
    const normalizedCode = normalizeRoomCode(roomCodeInput);
    if (normalizedCode.length !== 6) {
      setError("Enter a valid 6-digit room code.");
      return;
    }
    if (!playerName.trim()) {
      setError("Enter your name before joining.");
      return;
    }
    setJoining(true);
    try {
      // A new Join action must create a new player record.
      // Keep this ID for refreshes, but never reuse the previous join's ID.
      const newPlayerId = globalThis.crypto?.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

      const trimmedName = playerName.trim();

      await joinRoom(normalizedCode, trimmedName, newPlayerId);

      // Ensure the player record contains the fields used by the host's player list.
      await update(
        ref(db, `rooms/${normalizedCode}/players/${newPlayerId}`),
        {
          name: trimmedName,
          ticketGenerated: false,
          ticketCount: 0,
          joinedAt: Date.now(),
        }
      );

      setPlayerId(newPlayerId);
      localStorage.setItem("tambolaRoomCode", normalizedCode);
      localStorage.setItem("tambolaPlayerName", trimmedName);
      localStorage.setItem("tambolaPlayerId", newPlayerId);
      setRoomCode(normalizedCode);
      setMode("tickets");
      navigate(`/ticket/${normalizedCode}`, { replace: true });
    } catch (joinError) {
      setError(joinError.message || "Unable to join room.");
    } finally {
      setJoining(false);
    }
  };

  const generateTickets = async () => {
    setError("");
    if (roomGameStarted || generatedNumbers.length > 0) {
      setRoomGameStarted(true);
      setError("The number caller has already started. Ticket generation is closed.");
      return;
    }
    if (!roomActive) {
      setError("This room is closed.");
      return;
    }
    setLoading(true);

    try {
      // Keep generation asynchronous without delaying Firebase status updates.
      await new Promise((resolve) => window.setTimeout(resolve, 300));

      const used = new Set();
      const result = [];

      for (let ticketIndex = 0; ticketIndex < count; ticketIndex += 1) {
        let ticket;
        let attempts = 0;

        do {
          ticket = createTicket();
          attempts += 1;
        } while (
          ticket.flat().filter(Boolean).some((number) => used.has(number)) &&
          attempts < 100
        );

        const numbers = ticket.flat().filter(Boolean);
        numbers.forEach((number) => used.add(number));
        result.push(ticket);
      }

      setTickets(result);
      setMarked([]);
      setGameStarted(true);

      // Atomically save tickets only while the room is still in its lobby.
      // If the host has called a number, this transaction is rejected.
      if (roomCode && playerId) {
        const roomRef = ref(db, `rooms/${roomCode}`);
        const saveResult = await runTransaction(roomRef, (room) => {
          if (!room || room.roomActive !== true) return;

          const calledNumbers = Array.isArray(room.generatedNumbers)
            ? room.generatedNumbers
            : [];
          if (room.gameStarted === true || calledNumbers.length > 0) return;

          const players = room.players && typeof room.players === "object"
            ? { ...room.players }
            : {};
          const existingPlayer = players[playerId];
          if (!existingPlayer) return;

          players[playerId] = {
            ...existingPlayer,
            name: playerName.trim() || localStorage.getItem("tambolaPlayerName") || "Player",
            ticketGenerated: true,
            ticketCount: result.length,
            ticketGeneratedAt: Date.now(),
            // Never write sparse/null-containing arrays to Realtime Database.
            // Empty strings preserve all 27 grid positions across Firebase round-trips.
            tickets: result.map((ticket) =>
              ticket.map((row) => row.map((cell) => cell ?? ""))
            ),
          };

          return { ...room, players };
        });

        if (!saveResult.committed) {
          setTickets([]);
          setGameStarted(false);
          const latestRoom = saveResult.snapshot.val();
          const locked = !latestRoom ||
            latestRoom.gameStarted === true ||
            (Array.isArray(latestRoom.generatedNumbers) && latestRoom.generatedNumbers.length > 0);
          if (locked) {
            setRoomGameStarted(true);
            throw new Error("The number caller has already started. You cannot generate tickets now.");
          }
          throw new Error("Your player record was not found. Please rejoin the room.");
        }
      }
    } catch (generationError) {
      setError(generationError.message || "Unable to generate tickets.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrizeClaim = async (prizeKey, prizeLabel) => {
    if (!roomCode || !playerId) {
      setError("Join a multiplayer room before claiming a prize.");
      return;
    }
    if (claims[prizeKey]) {
      setError(`${prizeLabel} has already been claimed by ${claims[prizeKey].playerName || "another player"}.`);
      return;
    }
    const confirmed = window.confirm(`Submit your claim for ${prizeLabel}? Your ticket will be checked against all numbers called so far.`);
    if (!confirmed) return;

    setClaimingPrize(prizeKey);
    setError("");
    try {
      // Validate and save the claim atomically so two players cannot win
      // the same prize at the same time. The ticket data is read from Firebase,
      // not from the locally displayed/marked ticket.
      let validationError = "";
      const roomRef = ref(db, `rooms/${roomCode}`);
      const claimResult = await runTransaction(roomRef, (room) => {
        validationError = "";
        if (!room || room.roomActive !== true) {
          validationError = "This room is closed or unavailable.";
          return;
        }
        if (room.claims?.[prizeKey]) {
          validationError = `${prizeLabel} has already been claimed by ${room.claims[prizeKey].playerName || "another player"}.`;
          return;
        }

        const player = room.players?.[playerId];
        if (!player) {
          validationError = "Your player record was not found. Please rejoin the room.";
          return;
        }

        const called = new Set(Array.isArray(room.generatedNumbers) ? room.generatedNumbers : []);
        const playerTickets = normalizeFirebaseTickets(player.tickets);
        if (!areValidTambolaTickets(playerTickets)) {
          validationError = "No valid tickets were found for your player.";
          return;
        }

        const winningTicketIndex = playerTickets.findIndex((ticket) => {
          const rows = ticket.map((row) => row.filter((number) => Number.isInteger(number)));
          const allNumbers = rows.flat();
          if (prizeKey === "jaldi5") {
            return allNumbers.filter((number) => called.has(number)).length >= 5;
          }
          if (prizeKey === "firstLine") return rows[0].length === 5 && rows[0].every((number) => called.has(number));
          if (prizeKey === "secondLine") return rows[1].length === 5 && rows[1].every((number) => called.has(number));
          if (prizeKey === "lastLine") return rows[2].length === 5 && rows[2].every((number) => called.has(number));
          if (prizeKey === "fullHouse") return allNumbers.length === 15 && allNumbers.every((number) => called.has(number));
          validationError = "Unknown prize category.";
          return false;
        });

        if (winningTicketIndex < 0) {
          validationError = prizeKey === "fullHouse"
            ? "Full House is not complete yet. All 15 numbers on one ticket must have been called."
            : `Your ticket does not qualify for ${prizeLabel} yet.`;
          return;
        }

        return {
          ...room,
          claims: {
            ...(room.claims || {}),
            [prizeKey]: {
              prizeKey,
              prizeName: prizeLabel,
              playerId,
              playerName: player.name || playerName || "Player",
              ticketIndex: winningTicketIndex,
              claimedAt: Date.now(),
            },
          },
        };
      }, { applyLocally: false });

      if (!claimResult.committed) {
        const latestRoom = claimResult.snapshot.val();
        const existingClaim = latestRoom?.claims?.[prizeKey];
        throw new Error(validationError || (existingClaim
          ? `${prizeLabel} has already been claimed by ${existingClaim.playerName || "another player"}.`
          : `Your ticket does not qualify for ${prizeLabel} yet.`));
      }
      window.alert(`Your ${prizeLabel} claim has been confirmed!`);
    } catch (claimError) {
      setError(claimError.message || "Unable to submit your claim.");
    } finally {
      setClaimingPrize("");
    }
  };

  const toggleMark = (number) => {
    if (!number) return;
    setMarked((previous) => previous.includes(number)
      ? previous.filter((item) => item !== number)
      : [...previous, number]);
  };

  const startNewGame = async () => {
    if (roomCode && playerId) {
      const confirmed = window.confirm(
        "Drop out of the current game? Your tickets will be removed, and the other players can continue."
      );
      if (!confirmed) return;

      try {
        await dropPlayer(roomCode, playerId);
      } catch (dropError) {
        console.error("Could not mark player as dropped:", dropError);
        setError(dropError.message || "Unable to leave the current game.");
        return;
      }
    }

    setTickets([]);
    setMarked([]);
    setGameStarted(false);
    ["tambolaRoomCode", "tambolaPlayerName", "tambolaPlayerId"].forEach((key) => localStorage.removeItem(key));
    navigate("/", { replace: true });
  };

  const goHome = async () => {
    if (roomCode && playerId) {
      try { await remove(ref(db, `rooms/${roomCode}/players/${playerId}`)); } catch (removeError) {
        console.error("Could not remove player from room", removeError);
      }
    }
    ["tambolaRoomCode", "tambolaPlayerName", "tambolaPlayerId"].forEach((key) => localStorage.removeItem(key));
    navigate("/");
  };

  if (mode === null) {
    return (
      <>
      <style>{`
        :root[data-theme="light"] .tambola-theme-page,
        :root[data-theme="light"] .tambola-glass-screen {
          background: radial-gradient(circle at 15% 10%, #ffffff 0%, #eef3fb 55%, #e3eaf5 100%) !important;
          color: #172033 !important;
        }
        :root[data-theme="dark"] .tambola-theme-page,
        :root[data-theme="dark"] .tambola-glass-screen {
          background: radial-gradient(circle at 15% 10%, #243b60 0%, #111827 42%, #080d18 100%) !important;
          color: #f8fafc !important;
        }
        :root[data-theme="light"] .tambola-theme-page h1,
        :root[data-theme="light"] .tambola-theme-page h2,
        :root[data-theme="light"] .tambola-theme-page p,
        :root[data-theme="light"] .tambola-glass-screen h1,
        :root[data-theme="light"] .tambola-glass-screen h2,
        :root[data-theme="light"] .tambola-glass-screen h3,
        :root[data-theme="light"] .tambola-glass-screen p,
        :root[data-theme="light"] .tambola-glass-screen strong,
        :root[data-theme="light"] .tambola-glass-screen span { color: #172033 !important; }
        :root[data-theme="light"] .tambola-theme-page input,
        :root[data-theme="light"] .tambola-glass-screen input,
        :root[data-theme="light"] .tambola-glass-screen select {
          background: rgba(255,255,255,.82) !important; color: #172033 !important;
          border: 1px solid rgba(100,116,139,.35) !important;
        }
        :root[data-theme="light"] .tambola-theme-page > div,
        :root[data-theme="light"] .tambola-glass-screen div[style*="border-radius"] {
          background: rgba(255,255,255,.68) !important;
          border: 1px solid rgba(148,163,184,.32) !important;
          box-shadow: 0 12px 32px rgba(31,48,75,.09), inset 0 1px 0 rgba(255,255,255,.9) !important;
          backdrop-filter: blur(22px) saturate(145%); -webkit-backdrop-filter: blur(22px) saturate(145%);
        }
        :root[data-theme="dark"] .tambola-theme-page input,
        :root[data-theme="dark"] .tambola-glass-screen input,
        :root[data-theme="dark"] .tambola-glass-screen select {
          background: rgba(15,23,42,.72) !important; color: #f8fafc !important;
        }
      `}</style><div className="tambola-theme-page" style={{ ...pageStyle, display: "flex", justifyContent: "center", alignItems: "center", padding: screenWidth < 600 ? "20px" : "40px", minHeight: "100vh", boxSizing: "border-box" }}>
        <style>{`
          .tambola-menu-card { width:min(100%,430px); padding:38px 34px; border-radius:28px; display:flex; flex-direction:column; align-items:center; gap:20px; background:rgba(255,255,255,.48); border:1px solid rgba(255,255,255,.72); box-shadow:0 24px 60px rgba(31,48,75,.14),inset 0 1px 0 rgba(255,255,255,.85); backdrop-filter:blur(28px) saturate(165%); -webkit-backdrop-filter:blur(28px) saturate(165%); }
          .tambola-menu-card h1 { margin:0 0 10px; font-size:clamp(32px,7vw,42px); font-weight:750; letter-spacing:-.045em; color:#172033; }
          .tambola-menu-card button { width:min(100%,270px); min-height:54px; border-radius:16px!important; font-size:16px; transition:transform .18s ease,box-shadow .18s ease,filter .18s ease; }
          .tambola-menu-card button:hover { transform:translateY(-2px); filter:brightness(1.06); box-shadow:0 14px 28px rgba(15,23,42,.18); }
          :root[data-theme="dark"] .tambola-menu-card { background:rgba(15,23,42,.48); border-color:rgba(255,255,255,.14); box-shadow:0 24px 60px rgba(0,0,0,.32),inset 0 1px 0 rgba(255,255,255,.1); }
          :root[data-theme="dark"] .tambola-menu-card h1 { color:#f8fafc; }
        `}</style>
        <div className="tambola-menu-card">
          <h1>Tambola</h1>
          <button style={{ ...buttonStyle, background: "#2563eb" }} onClick={() => navigate("/")}>Home</button>
          <button style={{ ...buttonStyle, background: "#16a34a" }} onClick={() => { setPlayerName(""); setRoomCodeInput(""); setError(""); setMode("join"); }}>Join Room</button>
          <button style={{ ...buttonStyle, background: "#475569" }} onClick={() => setMode("normal")}>Normal Tickets</button>
        </div>
      </div></>
    );
  }

  if (mode === "join") {
    return (
      <>
        <style>{`
          :root[data-theme="light"] .tambola-theme-page { background:radial-gradient(circle at 15% 10%,#fff 0%,#eef3fb 55%,#e3eaf5 100%)!important;color:#172033!important; }
          :root[data-theme="dark"] .tambola-theme-page { background:radial-gradient(circle at 15% 10%,#243b60 0%,#111827 42%,#080d18 100%)!important;color:#f8fafc!important; }
          .tambola-join-card { width:min(100%,430px); padding:30px; border-radius:24px; display:flex; flex-direction:column; align-items:stretch; gap:16px; background:rgba(255,255,255,.16); border:1px solid rgba(255,255,255,.28); box-shadow:0 22px 55px rgba(15,23,42,.16),inset 0 1px 0 rgba(255,255,255,.38); backdrop-filter:blur(26px) saturate(155%); -webkit-backdrop-filter:blur(26px) saturate(155%); }
          .tambola-join-card h2 { margin:0 0 6px; text-align:center; font-size:28px; letter-spacing:-.04em; }
          .tambola-join-card input { width:100%; box-sizing:border-box; padding:14px 16px!important; border-radius:13px!important; font-size:16px!important; outline:none; background:rgba(255,255,255,.72)!important; color:#172033!important; border:1px solid rgba(100,116,139,.3)!important; box-shadow:inset 0 1px 2px rgba(15,23,42,.04); }
          .tambola-join-card input:focus { border-color:#60a5fa!important; box-shadow:0 0 0 4px rgba(96,165,250,.18); }
          .tambola-join-card button { width:100%; }
          :root[data-theme="dark"] .tambola-join-card { background:rgba(15,23,42,.48); border-color:rgba(255,255,255,.14); box-shadow:0 22px 55px rgba(0,0,0,.3),inset 0 1px 0 rgba(255,255,255,.1); }
          :root[data-theme="dark"] .tambola-join-card input { background:rgba(15,23,42,.72)!important; color:#f8fafc!important; border-color:rgba(148,163,184,.28)!important; }
        `}</style>
        <div className="tambola-theme-page" style={{ ...pageStyle, minHeight:"100vh", padding:"24px", display:"flex", justifyContent:"center", alignItems:"center", boxSizing:"border-box" }}>
          <div className="tambola-join-card">
            <h2>Join Room</h2>
            <input aria-label="Room Code" placeholder="6-digit Room Code" value={roomCodeInput}
              maxLength={6} inputMode="numeric" onChange={(event) => setRoomCodeInput(normalizeRoomCode(event.target.value))} />
            <input aria-label="Player Name" placeholder="Player Name" value={playerName}
              onChange={(event) => setPlayerName(event.target.value)} />
            {error && <p role="alert" style={{ color: "#dc2626", margin:"0", textAlign:"center" }}>{error}</p>}
            <button disabled={joining} style={{ ...buttonStyle, background: joining ? "#64748b" : "linear-gradient(135deg,#16a34a,#059669)", opacity: joining ? 0.75 : 1 }} onClick={handleJoin}>
              {joining ? "Validating Room..." : "Join Game"}
            </button>
            <button style={{ ...buttonStyle, background: "rgba(71,85,105,.9)" }} onClick={() => { setError(""); setMode(null); }}>Back</button>
          </div>
        </div>
      </>
    );
  }

  if (mode === "tickets" && roomCode && !roomActive) {
    return <><style>{` :root[data-theme="light"] .tambola-theme-page{background:linear-gradient(135deg,#fff,#e8eef8)!important;color:#172033!important}:root[data-theme="light"] .tambola-theme-page h2,:root[data-theme="light"] .tambola-theme-page p{color:#172033!important}:root[data-theme="light"] .tambola-theme-page button{color:#fff!important}`}</style><div className="tambola-theme-page" style={{ ...pageStyle, textAlign: "center", paddingTop: "100px" }}>
      <h2>Room unavailable</h2><p>{error || "This room is closed."}</p>
      <button style={{ ...buttonStyle, background: "#334155" }} onClick={goHome}>Back To Home</button>
    </div></>;
  }

  if (isGameCompleted) {
    return <CelebrationScreen claims={claims} roomCode={roomCode} onHome={() => navigate("/")} />;
  }

  return (
    <div className="glass-page tambola-glass-screen" style={{ ...pageStyle, padding: screenWidth < 600 ? "15px" : "30px", overflowX: "hidden" }}>
      <style>{`
        .tambola-glass-screen{position:relative;isolation:isolate}
        .tambola-room-header{display:flex;align-items:center;justify-content:space-between;gap:22px;margin:8px 0 24px;background:transparent!important;border:0!important;box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;padding:0!important;}
        .tambola-title-block{min-width:0;}
        .tambola-room-code-card{display:flex;align-items:center;justify-content:flex-start;gap:22px;flex-wrap:nowrap;width:auto;max-width:100%;min-width:0;margin-left:auto;align-self:flex-end;padding:16px 20px;border-radius:18px;box-sizing:border-box;}
        .tambola-room-code-card .tambola-room-actions{order:1;}
        .tambola-room-code-card .tambola-room-code-info{order:2;margin-left:0;}
        .tambola-room-code-info{display:flex;align-items:center;justify-content:flex-end;gap:16px;flex-shrink:0;margin-left:auto;}
        .tambola-room-actions{display:flex;align-items:center;justify-content:flex-start;flex-wrap:wrap;gap:10px;min-width:0;}
        .tambola-room-actions button{min-height:44px;white-space:nowrap;}
        .tambola-room-actions select{padding:10px 12px;border-radius:10px;font-size:15px;}
        .tambola-room-code-card span{font-size:13px;font-weight:750;letter-spacing:.08em;}
        .tambola-room-code-card strong{font-size:clamp(22px,3vw,29px);letter-spacing:.18em;white-space:nowrap;}
        .tambola-live-info-card{display:grid;grid-template-columns:minmax(220px,.85fr) minmax(0,1.6fr);gap:24px;align-items:start;margin:0 0 24px;padding:20px;border-radius:20px;}
        .tambola-live-info-card h3{margin:0 0 14px;font-size:18px;font-weight:750;}
        .tambola-last-called{min-width:0;}
        .tambola-last-number-list{display:flex;flex-wrap:wrap;gap:8px;}
        .tambola-last-number{display:inline-flex;align-items:center;justify-content:center;min-width:38px;height:38px;padding:0 9px;border-radius:12px;background:linear-gradient(145deg,rgba(226,237,250,.96),rgba(194,211,232,.88));border:1px solid rgba(255,255,255,.9);box-shadow:0 4px 12px rgba(31,55,88,.10),inset 0 1px 0 rgba(255,255,255,.9);font-weight:750;color:#172b4d!important;}
        .tambola-no-numbers{font-size:14px;}
        .tambola-prize-buttons{display:flex;flex-wrap:wrap;gap:10px;}
        .tambola-prize-buttons button{min-height:48px;}
        .tambola-ticket-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px;justify-content:center;background:transparent!important;border:0!important;box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;padding:0!important;margin:0!important;border-radius:0!important;}
        .tambola-ticket-card{padding:18px!important;border-radius:22px!important;overflow-x:auto;min-width:0;}
        .tambola-ticket-cell{position:relative;isolation:isolate;overflow:hidden;backdrop-filter:blur(12px) saturate(145%);-webkit-backdrop-filter:blur(12px) saturate(145%);}
        .tambola-ticket-cell.is-number{background:linear-gradient(145deg,rgba(226,237,250,.96),rgba(194,211,232,.88))!important;color:#172b4d!important;border:1px solid rgba(255,255,255,.82)!important;box-shadow:0 4px 12px rgba(31,55,88,.12),inset 0 1px 0 rgba(255,255,255,.9)!important;}
        .tambola-ticket-cell.is-empty{background:linear-gradient(145deg,rgba(241,245,251,.78),rgba(221,229,240,.68))!important;border:1px solid rgba(148,163,184,.28)!important;box-shadow:inset 0 1px 2px rgba(255,255,255,.7)!important;cursor:default!important;}
        .tambola-ticket-cell.is-marked{background:linear-gradient(145deg,#34d399,#16a34a)!important;color:#fff!important;border:1px solid rgba(255,255,255,.48)!important;box-shadow:0 5px 15px rgba(22,163,74,.28),inset 0 1px 0 rgba(255,255,255,.35)!important;}
        .tambola-ticket-cell.is-number:not(:disabled):hover{background:linear-gradient(145deg,#d7e8fc,#b5cce8)!important;filter:none!important;box-shadow:0 7px 16px rgba(31,55,88,.2)!important;}
        .tambola-ticket-cell.is-marked:not(:disabled):hover{filter:brightness(1.06)!important;}
        :root[data-theme="dark"] .tambola-last-number{background:linear-gradient(145deg,rgba(71,94,126,.96),rgba(43,61,88,.94));color:#f8fbff!important;border-color:rgba(191,219,254,.22);}
        :root[data-theme="dark"] .tambola-ticket-cell.is-number{background:linear-gradient(145deg,rgba(71,94,126,.96),rgba(43,61,88,.94))!important;color:#f8fbff!important;border:1px solid rgba(191,219,254,.22)!important;box-shadow:0 4px 14px rgba(0,0,0,.25),inset 0 1px 0 rgba(255,255,255,.12)!important;}
        :root[data-theme="dark"] .tambola-ticket-cell.is-empty{background:linear-gradient(145deg,rgba(15,23,42,.68),rgba(30,41,59,.58))!important;border:1px solid rgba(148,163,184,.2)!important;box-shadow:inset 0 1px 3px rgba(0,0,0,.2)!important;}
        :root[data-theme="dark"] .tambola-ticket-cell.is-marked{background:linear-gradient(145deg,#34d399,#16a34a)!important;color:#fff!important;}
        @media(max-width:760px){.tambola-room-header{align-items:stretch;flex-direction:column;}.tambola-room-code-card{width:100%;min-width:0;margin-left:0;box-sizing:border-box;align-items:stretch;flex-direction:column;}.tambola-room-actions{justify-content:flex-start;width:100%;}.tambola-room-code-info{width:100%;justify-content:space-between;margin-left:0;}.tambola-live-info-card{grid-template-columns:1fr;gap:20px;padding:16px;}.tambola-ticket-grid{grid-template-columns:1fr;}}
        @media(max-width:560px){.tambola-room-actions{display:grid;grid-template-columns:1fr 1fr;width:100%;}.tambola-room-actions button{width:100%;white-space:normal;}.tambola-room-actions select{grid-column:1/-1;width:100%;}.tambola-room-code-info{width:100%;justify-content:space-between;}}
        .tambola-glass-screen button{transition:transform .18s ease,filter .18s ease,box-shadow .18s ease!important}
        .tambola-glass-screen button:not(:disabled):hover{transform:translateY(-2px);filter:brightness(1.08)}
        .tambola-glass-screen button:disabled{opacity:.58;cursor:not-allowed!important}
        .tambola-glass-screen [style*="grid-template-columns: repeat(9"]{gap:7px!important}
        @media(max-width:600px){.tambola-glass-screen{padding:16px!important}.tambola-glass-screen [style*="grid-template-columns: repeat(9"]{gap:4px!important}.tambola-ticket-card{padding:12px!important;border-radius:17px!important;}}
        @media(prefers-reduced-motion:reduce){.tambola-glass-screen *{transition:none!important}}
      `}</style>
      <div className="tambola-room-header">
        <div className="tambola-title-block">
          <h1 style={{ margin: 0, fontSize: screenWidth < 600 ? "30px" : "38px", fontWeight: "700" }}>Tambola Tickets</h1>
          <p style={{ color: "#94a3b8", margin: "8px 0 0", fontSize: screenWidth < 600 ? "14px" : "16px" }}>Generate and play Tambola tickets</p>
        </div>
        {(mode === "normal" || (roomCode && mode === "tickets")) && (
          <div className="tambola-room-code-card tambola-glass-card">
            <div className="tambola-room-actions">
              {!gameStarted && (
                <select
                  value={count}
                  onChange={(event) => setCount(Number(event.target.value))}
                  aria-label="Number of tickets"
                >
                  {[1, 2, 3, 4].map((number) => (
                    <option key={number} value={number}>{number}</option>
                  ))}
                </select>
              )}
              <button
                style={{ ...buttonStyle, background: gameStarted ? "#475569" : "#2563eb" }}
                onClick={generateTickets}
                disabled={gameStarted || loading || (mode === "tickets" && (roomGameStarted || !roomActive))}
              >
                {mode === "tickets" && roomGameStarted
                  ? "Ticket Generation Closed"
                  : loading ? "Generating Tickets..." : "Generate Tickets"}
              </button>
              {mode === "tickets" ? (
                <button style={{ ...buttonStyle, background: "#c04b2e" }} onClick={startNewGame}>
                  Leave Room
                </button>
              ) : (
                <button style={{ ...buttonStyle, background: "#334155" }} onClick={() => {
                  setTickets([]);
                  setMarked([]);
                  setGameStarted(false);
                  setMode(null);
                }}>
                  Back
                </button>
              )}
            </div>
            {mode === "tickets" && roomCode && (
              <div className="tambola-room-code-info">
                <span>ROOM CODE</span>
                <strong>{roomCode}</strong>
              </div>
            )}
          </div>
        )}
      </div>

      {roomCode && mode === "tickets" && (
        <div className="tambola-live-info-card tambola-glass-card">
          <section className="tambola-last-called">
            <h3>Last 10 Called Numbers</h3>
            <div className="tambola-last-number-list">
              {lastTen.length ? lastTen.map((number, index) => (
                <span className="tambola-last-number" key={`${number}-${index}`}>{number}</span>
              )) : <span className="tambola-no-numbers">No numbers called yet</span>}
            </div>
          </section>
          {tickets.length > 0 && (
            <section className="tambola-prize-claims">
              <h3>Prize Claims</h3>
              <div className="tambola-prize-buttons">
                {[
                  ["jaldi5", "Jaldi 5"],
                  ["firstLine", "First Line"],
                  ["secondLine", "Second Line"],
                  ["lastLine", "Last Line"],
                  ["fullHouse", "Full House"],
                ].map(([key, label]) => {
                  const winner = claims[key];
                  return (
                    <button
                      key={key}
                      disabled={Boolean(winner) || Boolean(claimingPrize)}
                      onClick={() => handlePrizeClaim(key, label)}
                      style={{
                        ...buttonStyle,
                        background: winner ? "#475569" : "#16a34a",
                        opacity: claimingPrize && claimingPrize !== key ? 0.65 : 1,
                        cursor: winner || claimingPrize ? "not-allowed" : "pointer",
                      }}
                    >
                      {winner ? `${label} — ${winner.playerName}` : claimingPrize === key ? "Checking..." : `Claim ${label}`}
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
      {error && <p role="alert" style={{ color: "#fca5a5" }}>{error}</p>}

      <div className="tambola-ticket-grid" style={{ gridTemplateColumns: screenWidth < 700 ? "1fr" : "repeat(2, minmax(0, 1fr))" }}>
        {tickets.map((ticket, ticketIndex) => (
          <div key={ticketIndex} className="tambola-ticket-card tambola-glass-card" style={{ padding: screenWidth < 600 ? "12px" : "15px", overflowX: "auto" }}>
            <h3 style={{ marginBottom: "15px", fontSize: screenWidth < 600 ? "18px" : "22px" }}>Ticket {ticketIndex + 1}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: screenWidth < 600 ? "4px" : "6px" }}>
              {ticket.map((row, rowIndex) => row.map((cell, columnIndex) => {
                const isBlank = cell === null || cell === undefined || cell === "";
                const isMarked = !isBlank && marked.includes(cell);
                return <button type="button" key={`${rowIndex}-${columnIndex}`} className={`tambola-ticket-cell ${isBlank ? "is-empty" : isMarked ? "is-marked" : "is-number"}`} onClick={() => { if (!isBlank) toggleMark(cell); }} style={{ height: screenWidth < 600 ? "36px" : "45px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: screenWidth < 600 ? "8px" : "10px", cursor: !isBlank ? "pointer" : "default", fontWeight: "700", fontSize: screenWidth < 600 ? "13px" : "16px", transition: "transform .18s ease, box-shadow .18s ease, background .18s ease", boxSizing: "border-box", padding: 0 }}>{isBlank ? "" : cell}</button>;
              }))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
