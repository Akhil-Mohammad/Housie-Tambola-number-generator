import React, {
  useState,
  useEffect,
  useRef,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import { get, onValue, ref } from "firebase/database";
import { db } from "../firebase";
import { getActiveRoom, publishNextNumber, endRoomGame } from "../services/roomService";



import { useTheme } from "../context/ThemeContext";
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

function confirmHomeNavigation(onHome) {
  const confirmed = window.confirm(
    "Are you sure you want to go Home? You are currently in the middle of a game. You will leave this game screen, but the room and its saved game data will remain available."
  );

  if (confirmed) onHome();
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
  const winners = requiredPrizes.flatMap((key) => {
    const value = claims?.[key];
    const list = Array.isArray(value) ? value : value ? [value] : [];
    return list.map((claim, index) => ({ ...claim, key, winnerKey: `${key}-${claim.playerId || "player"}-${claim.ticketIndex ?? index}` }));
  });

  return (
    <div className="tambola-celebration-page">
      <style>{`
        .tambola-celebration-page{min-height:100vh;box-sizing:border-box;padding:28px 16px;background:radial-gradient(circle at top,#263b68 0%,#111827 48%,#080d1b 100%);color:#fff;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;font-family:Arial,sans-serif;text-align:center}
        .tambola-celebration-card{width:min(760px,100%);padding:34px 24px;border-radius:24px;background:rgba(30,41,59,.94);box-shadow:0 20px 70px rgba(0,0,0,.45);position:relative;z-index:2;border:1px solid rgba(255,255,255,.12)}
        .tambola-trophy{font-size:64px;animation:tambolaBounce 1.3s infinite alternate}
        .tambola-winner-row{display:flex;align-items:center;justify-content:space-between;gap:12px;text-align:left;padding:14px 16px;margin:10px 0;background:#0f172a;border-radius:12px;border-left:4px solid #22c55e}
        .tambola-confetti{position:absolute;inset:-20px;pointer-events:none;overflow:hidden;z-index:1}
        .tambola-confetti i{position:absolute;top:-12%;width:9px;height:16px;border-radius:2px;background:hsl(var(--hue),90%,60%);left:var(--left);animation: tambolaFall var(--duration) linear infinite;animation-delay:var(--delay);transform:rotate(var(--rotation))}
        @keyframes tambolaFall{to{transform:translate3d(var(--drift),115vh,0) rotate(900deg)}}
        @keyframes tambolaBounce{to{transform:translateY(-12px) rotate(5deg)}}
        @media(max-width:520px){.tambola-celebration-card{padding:26px 15px}.tambola-winner-row{align-items:flex-start;flex-direction:column}}
      `}</style>
      <div className="tambola-confetti" aria-hidden="true">
        {Array.from({ length: 70 }, (_, index) => (
          <i key={index} style={{
            "--left": `${(index * 37) % 100}%`,
            "--hue": `${(index * 47) % 360}`,
            "--duration": `${4 + (index % 6)}s`,
            "--delay": `${-(index % 9)}s`,
            "--rotation": `${index * 29}deg`,
            "--drift": `${(index % 2 ? 1 : -1) * (20 + (index % 80))}px`,
          }} />
        ))}
      </div>
      <section className="tambola-celebration-card">
        <div className="tambola-trophy">🏆</div>
        <p style={{ color: "#86efac", fontWeight: 800, letterSpacing: 3, marginBottom: 8 }}>GAME COMPLETED</p>
        <h1 style={{ fontSize: "clamp(32px,6vw,54px)", margin: "8px 0", color: "#facc15" }}>Congratulations!</h1>
        <p style={{ color: "#cbd5e1", fontSize: 17, marginTop: 0 }}>All five Tambola prizes have been claimed.</p>
        {roomCode && <p style={{ color: "#94a3b8" }}>Room Code: <strong>{roomCode}</strong></p>}
        <h2 style={{ margin: "28px 0 14px" }}>🎉 Winners 🎉</h2>
        {winners.map((winner) => (
          <div className="tambola-winner-row" key={winner.winnerKey}>
            <strong style={{ color: "#86efac" }}>🏆 {winner.prizeName || labels[winner.key]}</strong>
            <span><strong>{winner.playerName || "Winner"}</strong> <span style={{ color: "#94a3b8" }}>(Ticket {(winner.ticketIndex ?? 0) + 1})</span></span>
          </div>
        ))}
        <button onClick={() => confirmHomeNavigation(onHome)} style={{ marginTop: 24, padding: "13px 34px", border: 0, borderRadius: 10, background: "#16a34a", color: "white", fontWeight: 800, fontSize: 16, cursor: "pointer" }}>Home</button>
      </section>
    </div>
  );
}

function EndedGameScreen({ claims, roomCode, onHome }) {
  const prizeLabels = {
    jaldi5: "Jaldi 5",
    firstLine: "First Line",
    secondLine: "Second Line",
    lastLine: "Last Line",
    fullHouse: "Full House",
  };
  const winners = Object.entries(claims || {}).flatMap(([key, value]) =>
    (Array.isArray(value) ? value : value ? [value] : []).map((winner, index) => ({
      ...winner,
      id: `${key}-${winner.playerId || "player"}-${winner.ticketIndex ?? index}`,
      label: winner.prizeName || prizeLabels[key] || key,
    }))
  );

  return (
    <div style={{ minHeight: "100vh", padding: "30px 16px", boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", background: "radial-gradient(circle at top,#334155,#0f172a 70%)", color: "white", fontFamily: "Arial,sans-serif" }}>
      <section style={{ width: "min(680px,100%)", padding: "32px 22px", borderRadius: "22px", textAlign: "center", background: "rgba(30,41,59,.92)", border: "1px solid rgba(255,255,255,.15)", boxShadow: "0 20px 60px rgba(0,0,0,.35)" }}>
        <div style={{ fontSize: 58 }}>🏁</div>
        <p style={{ color: "#fca5a5", fontWeight: 800, letterSpacing: 2 }}>GAME ENDED BY HOST</p>
        <h1 style={{ color: "#f8fafc", margin: "8px 0" }}>This game has ended</h1>
        <p style={{ color: "#cbd5e1" }}>The host has ended this Tambola game. Tickets are no longer active.</p>
        {roomCode && <p style={{ color: "#94a3b8" }}>Room Code: <strong>{roomCode}</strong></p>}
        {/* <h2 style={{ marginTop: 26 }}>🏆 Prize Results</h2>
        {winners.length ? winners.map((winner) => (
          <div key={winner.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, textAlign: "left", padding: "12px 14px", margin: "9px 0", borderRadius: 10, background: "#0f172a" }}>
            <strong style={{ color: "#86efac" }}>{winner.label}</strong>
            <span>{winner.playerName || "Winner"} (Ticket {(winner.ticketIndex ?? 0) + 1})</span>
          </div> */}
        {/* )) : <p style={{ color: "#cbd5e1" }}>No prizes were recorded before the game ended.</p>} */}
        <button onClick={() => confirmHomeNavigation(onHome)} style={{ marginTop: 24, padding: "12px 30px", border: 0, borderRadius: 10, background: "#2563eb", color: "white", fontWeight: 700, cursor: "pointer" }}>Home</button>
      </section>
    </div>
  );
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
  const [claims, setClaims] = useState({});
  const [roomEnded, setRoomEnded] = useState(false);

  const REQUIRED_PRIZES = ["jaldi5", "firstLine", "secondLine", "lastLine", "fullHouse"];
  const isGameCompleted = Boolean(roomCode) && REQUIRED_PRIZES.every((key) => {
    const value = claims?.[key];
    return Array.isArray(value) ? value.length > 0 : Boolean(value);
  });

  const [autoPlay,
    setAutoPlay] =
    useState(false);

  const [intervalTime,
    setIntervalTime] =
    useState(3000);

  const [soundOn,
    setSoundOn] =
    useState(true);

  // Temporary toast notification for player requirements.
  const [toastMessage, setToastMessage] = useState("");

  // Keep the notification visible until the pointer leaves the Generate Number area.
  const showToast = (message) => {
    setToastMessage(message);
  };

  const { themeMode: selectedTheme } = useTheme();
  const darkMode = selectedTheme === "dark";

  // Room invitation: sharing is available only before the first number is called.
  // const roomShareUrl = roomCode
  //   ? `${window.location.origin}/ticket/${roomCode}`
  //   : "";

  // Invitation URL is opened on the Ticket page. The Ticket page handles
  // the invite=1 flag and always asks the new player for their name.
  const roomShareUrl = roomCode
    ? `${window.location.origin}/ticket/${encodeURIComponent(roomCode)}?invite=1`
    : "";

  const shareMessage = roomCode
    ? `Join my Tambola game!\nRoom Code: ${roomCode}\nJoin here: ${roomShareUrl}`
    : "";
  const sharingLocked = Boolean(roomCode) && generated.length > 0;

  const copyRoomLink = async () => {
    if (!roomShareUrl || sharingLocked) return;
    try {
      await navigator.clipboard.writeText(shareMessage);
      window.alert("Room invitation copied!");
    } catch (error) {
      // Fallback for browsers/contexts where Clipboard API is unavailable.
      const input = document.createElement("textarea");
      input.value = shareMessage;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      const copied = document.execCommand("copy");
      input.remove();
      window.alert(copied ? "Room invitation copied!" : "Unable to copy the invitation. Please copy the link manually.");
    }
  };

  const shareRoom = async () => {
  if (!roomShareUrl || sharingLocked) return;

  const shareMessage = `🎉 Join me for an Online Tambola Game!

🏠 Room Code: ${roomCode}

Click the link below to join the game:
${roomShareUrl}

Hurry up! Let's play together! 🎟️`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: "Join my Tambola Game",
        text: shareMessage,
      });
    } catch (error) {
      if (error?.name !== "AbortError") {
        await copyRoomLink();
      }
    }
  } else {
    await copyRoomLink();
  }
};

  const [screenWidth,
    setScreenWidth] =
    useState(window.innerWidth);

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
    get(ref(db, `rooms/${roomCode}`)).then((snapshot) => {
      if (!mounted) return;
      const room = snapshot.val();
      if (!room) {
        window.alert("This room no longer exists.");
        navigate("/", { replace: true });
        return;
      }
      if (room.roomStatus === "completed" || room.gameEnded === true) {
        setRoomEnded(true);
        setClaims(room.claims && typeof room.claims === "object" ? room.claims : {});
        return;
      }
      if (room.roomActive !== true) {
        window.alert("This room is closed.");
        navigate("/", { replace: true });
      }
    }).catch((error) => {
      if (mounted) {
        window.alert(error.message || "Unable to load this room.");
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

  const getPlayerRequirementMessage = () => {
    if (activePlayers.length < 2) {
      return `At least 2 active players are required. Currently: ${activePlayers.length}. Someone may have left the game.`;
    }
    if (pendingPlayers.length > 0) {
      return `Waiting for tickets from: ${pendingPlayers.map((player) => player.name).join(", ")}`;
    }
    return "";
  };

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
      if (data.roomStatus === "completed" || data.gameEnded === true) {
        stopAutoPlay();
        setRoomEnded(true);
        setClaims(data.claims && typeof data.claims === "object" ? data.claims : {});
        setGenerated(data.generatedNumbers || []);
        setCurrent(data.currentNumber ?? null);
        return;
      }
      if (data.roomActive !== true) {
        stopAutoPlay();
        window.alert("This room has been closed by the host.");
        navigate("/", { replace: true });
        return;
      }
      setRoomEnded(false);
      setGenerated(data.generatedNumbers || []);
      setCurrent(data.currentNumber ?? null);
      setClaims(data.claims && typeof data.claims === "object" ? data.claims : {});
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
    if (isGameCompleted) return;
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
      if (isGameCompleted) return;
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

  // Notify the host and stop auto-play if the room drops below two active players.
  const previousActiveCountRef = useRef(activePlayers.length);

  useEffect(() => {
    const previousCount = previousActiveCountRef.current;
    if (roomCode && generated.length > 0 && previousCount >= 2 && activePlayers.length < 2) {
      stopAutoPlay();
      showToast("A player has left the game. At least 2 active players are required to continue.");
    }
    previousActiveCountRef.current = activePlayers.length;
  }, [roomCode, activePlayers.length, generated.length]);

  // Stop the caller immediately when all five prize claims arrive from Firebase.
  useEffect(() => {
    if (isGameCompleted) {
      stopAutoPlay();
      window.speechSynthesis?.cancel();
    }
  }, [isGameCompleted]);

  useEffect(() => {
    if (autoPlay) {
      stopAutoPlay();

      startAutoPlay();
    }
  }, [intervalTime]);

  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
    };
  }, []);

  // Going Home during an active multiplayer game must end the room for everyone,
  // just like the explicit End Game action. Keep the saved tickets and results.
  const handleHome = async () => {
    const confirmed = window.confirm(
      roomCode
        ? "Are you sure you want to go Home? This will end the game for everyone. Number calling and prize claims will stop, and all players will see the final results. Tickets and winner records will be preserved."
        : "Are you sure you want to go Home?"
    );
    if (!confirmed) return;

    stopAutoPlay();
    window.speechSynthesis?.cancel();

    try {
      if (roomCode && !roomEnded) {
        await endRoomGame(roomCode);
      }
      navigate("/");
    } catch (error) {
      window.alert(error.message || "Unable to end the game. You have not been returned Home.");
    }
  };

  const handleEndGame = async () => {
    if (!roomCode) {
      window.alert("End Game is available only for multiplayer rooms.");
      return;
    }

    const confirmed = window.confirm(
      "End this game for everyone? Number calling and prize claims will stop. Player tickets will be marked inactive but retained for game history. This action cannot be undone."
    );
    if (!confirmed) return;

    stopAutoPlay();
    window.speechSynthesis?.cancel();
    try {
      await endRoomGame(roomCode);
      setRoomEnded(true);
    } catch (error) {
      window.alert(error.message || "Unable to end the game.");
    }
  };

  const cardStyle = {
    background: theme.card,

    borderRadius: "16px",

    padding: "20px",

    boxShadow:
      theme.shadow,

    color: theme.text,
  };

  if (roomEnded) {
    return <EndedGameScreen claims={claims} roomCode={roomCode} onHome={() => navigate("/")} />;
  }

  if (isGameCompleted) {
    return <CelebrationScreen claims={claims} roomCode={roomCode} onHome={() => navigate("/")} />;
  }

  return (
    <div className="glass-page number-generator-page"
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
      <style>{`
        .prize-news-track {
          display: inline-block;
          min-width: max-content;
          padding-left: 100%;
          animation: prizeNewsScroll 24s linear infinite;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: .2px;
        }
        .prize-news-ticker:hover .prize-news-track {
          animation-play-state: paused;
        }
        @keyframes prizeNewsScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .prize-news-track { animation: none; padding-left: 8px; white-space: normal; }
        }
      `}</style>
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

         <div
          style={{ position: "relative", width: "100%", marginTop: "10px" }}
          onMouseEnter={() => {
            if (roomCode && !allPlayersHaveTickets) showToast(getPlayerRequirementMessage());
          }}
          onMouseLeave={() => setToastMessage("")}
          onFocus={() => {
            if (roomCode && !allPlayersHaveTickets) showToast(getPlayerRequirementMessage());
          }}
        >
          <button
            onClick={generateNumber}
            disabled={isGameCompleted || autoPlay || (Boolean(roomCode) && !allPlayersHaveTickets)}
            style={{
              width: "100%", padding: "12px", marginTop: "0px", background: "green",
              color: "white", borderRadius: "8px", border: "none",
              cursor: (autoPlay || (Boolean(roomCode) && !allPlayersHaveTickets)) ? "not-allowed" : "pointer",
              opacity: (Boolean(roomCode) && !allPlayersHaveTickets) ? 0.55 : 1,
            }}
          >
            Generate Number
          </button>
          {toastMessage && (
            <div role="status" style={{
              position: "absolute", bottom: "calc(100% + 10px)", left: "50%",
              transform: "translateX(-50%)", width: "max-content", maxWidth: "280px",
              padding: "11px 15px", background: "#1e293b", color: "#ffffff",
              borderRadius: "10px", fontSize: "13px", fontWeight: 700, textAlign: "center",
              boxShadow: "0 8px 25px rgba(0,0,0,0.25)", zIndex: 1000, pointerEvents: "none",
            }}>
              {toastMessage}
            </div>
          )}
        </div>

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

        {roomCode && (
          <button
            onClick={handleEndGame}
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "10px",
              background: "#991b1b",
              color: "white",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,.2)",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            End Game
          </button>
        )}

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
        {/* Invite and live prize claims are now in the main header area. */}

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
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            marginBottom: "20px",
            gap: "10px",
            width: "100%",
          }}
        >
          <div style={{ width: "100%", minWidth: 0 }}>
            <div
              className="prize-news-ticker"
              role="status"
              aria-label="Live prize claims"
              style={{
                overflow: "hidden",
                whiteSpace: "nowrap",
                borderRadius: "10px",
                padding: "7px 0",
                marginBottom: "8px",
                background: darkMode ? "rgba(15,23,42,.72)" : "rgba(255,255,255,.58)",
                border: `1px solid ${darkMode ? "rgba(148,163,184,.22)" : "rgba(255,255,255,.7)"}`,
                color: theme.text,
              }}
            >
              <div className="prize-news-track">
                {Object.keys(claims).length === 0
                  ? "🏆 LIVE PRIZE CLAIMS  •  No prizes claimed yet  •  Stay tuned!"
                  : Object.entries(claims)
                      .flatMap(([key, value]) => (Array.isArray(value) ? value : value ? [value] : []))
                      .sort((a, b) => (a.claimedAt || 0) - (b.claimedAt || 0))
                      .map((claim) => `🏆 ${claim.prizeName || claim.prizeKey} — ${claim.playerName} (Ticket ${(claim.ticketIndex ?? 0) + 1})`)
                      .join("     •     ")}
              </div>
            </div>

          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", width: "100%", flexWrap: "wrap" }}>
            <h2 style={{ margin: "4px 0", fontSize: screenWidth < 600 ? "20px" : "24px" }}>
              Tambola Number Generator
            </h2>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexShrink: 0 }}>
            {roomCode && (
              <button
                type="button"
                onClick={shareRoom}
                disabled={sharingLocked}
                title={sharingLocked ? "Invites are locked after the first number is called" : "Invite players"}
                style={{
                  padding: "10px 16px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,.25)",
                  background: sharingLocked ? "#64748b" : "#3b82f6",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: sharingLocked ? "not-allowed" : "pointer",
                  opacity: sharingLocked ? 0.65 : 1,
                }}
              >
                Invite
              </button>
            )}
            <button
  type="button"
  onClick={handleHome}
  style={{
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "11px 22px",
    borderRadius: "12px",
    border: darkMode
      ? "1px solid rgba(255,255,255,.18)"
      : "1px solid rgba(59,130,246,.25)",
    background: darkMode
      ? "linear-gradient(135deg, #334155, #1e293b)"
      : "linear-gradient(135deg, #ffffff, #e8efff)",
    color: darkMode ? "#f8fafc" : "#1e3a8a",
    fontWeight: 800,
    fontSize: "14px",
    letterSpacing: ".3px",
    boxShadow: darkMode
      ? "0 5px 15px rgba(0,0,0,.25)"
      : "0 5px 15px rgba(59,130,246,.15)",
    cursor: "pointer",
    transition: "all .2s ease",
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = "translateY(-2px)";
    e.currentTarget.style.boxShadow = "0 8px 20px rgba(59,130,246,.25)";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow = darkMode
      ? "0 5px 15px rgba(0,0,0,.25)"
      : "0 5px 15px rgba(59,130,246,.15)";
  }}
>
  🏠 Home
</button>
            </div>
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