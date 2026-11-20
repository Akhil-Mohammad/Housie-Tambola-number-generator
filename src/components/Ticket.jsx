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
  background: "#0f172a", minHeight: "100vh", padding: "30px",
  color: "white", fontFamily: "sans-serif", boxSizing: "border-box",
};
const buttonStyle = {
  padding: "12px 20px", borderRadius: "10px", border: "none",
  color: "white", cursor: "pointer", fontWeight: "600",
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

      if (room.roomActive !== true) {
        setError("This room has been closed by the host.");
      } else if (locked) {
        setError("The game has already started. Ticket generation and new joins are closed.");
      }
    });
  }, [roomCode, mode]);

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
            tickets: result,
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
      <div style={{ ...pageStyle, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "20px" }}>
        <h1>Tambola</h1>
        <button style={{ ...buttonStyle, background: "#2563eb" }} onClick={() => navigate("/")}>Create Room</button>
        <button style={{ ...buttonStyle, background: "#16a34a" }} onClick={() => { setPlayerName(""); setRoomCodeInput(""); setError(""); setMode("join"); }}>Join Room</button>
        <button style={{ ...buttonStyle, background: "#475569" }} onClick={() => setMode("normal")}>Normal Tickets</button>
      </div>
    );
  }

  if (mode === "join") {
    return (
      <div style={{ ...pageStyle, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "15px" }}>
        <h2>Join Room</h2>
        <input aria-label="Room Code" placeholder="6-digit Room Code" value={roomCodeInput}
          maxLength={6} inputMode="numeric" onChange={(event) => setRoomCodeInput(normalizeRoomCode(event.target.value))}
          style={{ padding: "12px", borderRadius: "8px", border: "1px solid #475569", fontSize: "18px", letterSpacing: "3px" }} />
        <input aria-label="Player Name" placeholder="Player Name" value={playerName}
          onChange={(event) => setPlayerName(event.target.value)}
          style={{ padding: "12px", borderRadius: "8px", border: "1px solid #475569", fontSize: "16px" }} />
        {error && <p role="alert" style={{ color: "#fca5a5", maxWidth: "320px", textAlign: "center" }}>{error}</p>}
        <button disabled={joining} style={{ ...buttonStyle, background: joining ? "#475569" : "#16a34a" }} onClick={handleJoin}>
          {joining ? "Validating Room..." : "Join Game"}
        </button>
        <button style={{ ...buttonStyle, background: "#334155" }} onClick={() => { setError(""); setMode(null); }}>Back</button>
      </div>
    );
  }

  if (mode === "tickets" && roomCode && !roomActive) {
    return <div style={{ ...pageStyle, textAlign: "center", paddingTop: "100px" }}>
      <h2>Room unavailable</h2><p>{error || "This room is closed."}</p>
      <button style={{ ...buttonStyle, background: "#334155" }} onClick={goHome}>Back To Home</button>
    </div>;
  }

  return (
    <div style={{ ...pageStyle, padding: screenWidth < 600 ? "15px" : "30px", overflowX: "hidden" }}>
      {roomCode && mode === "tickets" && (
        <div style={{ background: "#1e293b", borderRadius: "12px", padding: "14px 18px", marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
          <span style={{ color: "#cbd5e1", fontWeight: 600 }}>ROOM CODE</span>
          <strong style={{ fontSize: "26px", letterSpacing: "4px", color: "#f8fafc" }}>{roomCode}</strong>
        </div>
      )}
      <div style={{ marginBottom: "30px" }}>
        <h1 style={{ margin: 0, fontSize: screenWidth < 600 ? "30px" : "38px", fontWeight: "700" }}>Tambola Tickets</h1>
        <p style={{ color: "#94a3b8", marginTop: "8px", fontSize: screenWidth < 600 ? "14px" : "16px" }}>Generate and play Tambola tickets</p>
      </div>

      {roomCode && mode === "tickets" && (
        <div style={{ background: "#1e293b", borderRadius: "10px", padding: "12px 15px", marginBottom: "20px" }}>
          <strong>Last 10 called numbers: </strong>{lastTen.length ? lastTen.join(", ") : "No numbers called yet"}
        </div>
      )}
      {error && <p role="alert" style={{ color: "#fca5a5" }}>{error}</p>}

      <div style={{ display: "flex", flexDirection: screenWidth < 700 ? "column" : "row", alignItems: screenWidth < 700 ? "stretch" : "center", gap: "15px", marginBottom: "30px", flexWrap: "wrap" }}>
        {!gameStarted && <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", background: "#1e293b", padding: "10px 15px", borderRadius: "10px", boxSizing: "border-box" }}>
          <span style={{ color: "#cbd5e1" }}>Tickets:</span>
          <select value={count} onChange={(event) => setCount(Number(event.target.value))} style={{ padding: "8px", borderRadius: "8px", border: "none", background: "#0f172a", color: "white", fontSize: "15px" }}>
            {[1, 2, 3, 4].map((number) => <option key={number} value={number}>{number}</option>)}
          </select>
        </div>}
        <button style={{ ...buttonStyle, background: gameStarted ? "#475569" : "#2563eb" }} onClick={generateTickets} disabled={gameStarted || loading || roomGameStarted || !roomActive}>{roomGameStarted ? "Ticket Generation Closed" : loading ? "Generating Tickets..." : "Generate Tickets"}</button>
        <button style={{ ...buttonStyle, background: "#dc2626" }} onClick={startNewGame}>Start New Game</button>
        <button style={{ ...buttonStyle, background: "#334155" }} onClick={() => {
          if (window.confirm("Current tickets will be lost. Go back to home?")) goHome();
        }}>Back To Home</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: screenWidth < 700 ? "1fr" : "repeat(2, 1fr)", gap: "20px", justifyContent: "center" }}>
        {tickets.map((ticket, ticketIndex) => (
          <div key={ticketIndex} style={{ background: "#1e293b", padding: screenWidth < 600 ? "12px" : "15px", borderRadius: "18px", boxShadow: "0 8px 25px rgba(0,0,0,0.3)", overflowX: "auto" }}>
            <h3 style={{ marginBottom: "15px", fontSize: screenWidth < 600 ? "18px" : "22px" }}>Ticket {ticketIndex + 1}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: screenWidth < 600 ? "4px" : "6px" }}>
              {ticket.map((row, rowIndex) => row.map((cell, columnIndex) => {
                const isMarked = marked.includes(cell);
                return <div key={`${rowIndex}-${columnIndex}`} onClick={() => toggleMark(cell)} style={{ height: screenWidth < 600 ? "36px" : "45px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: screenWidth < 600 ? "8px" : "10px", cursor: cell ? "pointer" : "default", background: cell ? (isMarked ? "#22c55e" : "#f8fafc") : "#0f172a", color: cell ? "#111827" : "transparent", fontWeight: "700", fontSize: screenWidth < 600 ? "13px" : "16px", transition: "0.2s", border: cell ? "2px solid transparent" : "2px solid #1e293b", boxSizing: "border-box" }}>{cell ?? ""}</div>;
              }))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
