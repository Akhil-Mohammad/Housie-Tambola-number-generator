import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { createRoom } from "../services/roomService";


function useDuplicateTabRedirect() {
  useEffect(() => {
    if (!("BroadcastChannel" in window)) return undefined;

    const storageKey = "tambolaTabSessionId";
    let sessionId = sessionStorage.getItem(storageKey);

    // A genuinely new tab has its own sessionStorage and is allowed to join.
    if (!sessionId) {
      sessionId = globalThis.crypto?.randomUUID
        ? globalThis.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      sessionStorage.setItem(storageKey, sessionId);
    }

    const channel = new BroadcastChannel(`tambola-duplicate-check-${sessionId}`);
    const documentId = globalThis.crypto?.randomUUID
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    let redirected = false;

    channel.onmessage = (event) => {
      const message = event.data || {};

      if (message.type === "TAMBOLA_TAB_PROBE" && message.from !== documentId) {
        channel.postMessage({
          type: "TAMBOLA_TAB_PRESENT",
          from: documentId,
          to: message.from,
        });
        return;
      }

      if (message.type === "TAMBOLA_TAB_PRESENT" && message.to === documentId && !redirected) {
        redirected = true;
        // Give this tab a fresh identity so Home does not detect it again.
        const freshSessionId = globalThis.crypto?.randomUUID
          ? globalThis.crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        sessionStorage.setItem(storageKey, freshSessionId);
        window.location.replace("/");
      }
    };

    // The original tab answers this probe. A normal refresh has no other
    // document with the same session ID, so it remains on the current page.
    const probeTimer = window.setTimeout(() => {
      channel.postMessage({ type: "TAMBOLA_TAB_PROBE", from: documentId });
    }, 150);

    return () => {
      window.clearTimeout(probeTimer);
      channel.close();
    };
  }, []);
}



export default function Home() {


   useDuplicateTabRedirect();
   
  const navigate = useNavigate();

  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [roomError, setRoomError] = useState("");
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    const root = document.documentElement;
    const body = document.body;
    return (
      root.classList.contains("dark") ||
      body.classList.contains("dark") ||
      root.dataset.theme === "dark" ||
      body.dataset.theme === "dark" ||
      root.classList.contains("dark-mode") ||
      body.classList.contains("dark-mode")
    );
  });

  // Follow the app-wide theme toggle without changing its existing implementation.
  useEffect(() => {
    const updateTheme = () => {
      const root = document.documentElement;
      const body = document.body;
      const theme = root.dataset.theme || body.dataset.theme || "";
      setIsDarkTheme(
        root.classList.contains("dark") ||
        body.classList.contains("dark") ||
        root.classList.contains("dark-mode") ||
        body.classList.contains("dark-mode") ||
        theme.toLowerCase() === "dark"
      );
    };

    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class", "data-theme"] });
    return () => observer.disconnect();
  }, []);

  const palette = isDarkTheme
    ? {
        pageText: "#f8fafc",
        panel: "rgba(15, 23, 42, 0.88)",
        panelBorder: "rgba(148, 163, 184, 0.28)",
        section: "rgba(15, 23, 42, 0.78)",
        sectionBorder: "rgba(148, 163, 184, 0.22)",
        card: "rgba(30, 41, 59, 0.96)",
        cardBorder: "rgba(148, 163, 184, 0.18)",
        heading: "#f1f5f9",
        body: "#cbd5e1",
        muted: "#a8b5c7",
        divider: "rgba(148, 163, 184, 0.28)",
        link: "#93c5fd",
        shadow: "0 8px 24px rgba(0, 0, 0, 0.22)",
      }
    : {
        pageText: "#172033",
        panel: "rgba(255, 255, 255, 0.82)",
        panelBorder: "rgba(255, 255, 255, 0.9)",
        section: "rgba(226, 232, 240, 0.72)",
        sectionBorder: "rgba(148, 163, 184, 0.28)",
        card: "rgba(255, 255, 255, 0.96)",
        cardBorder: "rgba(148, 163, 184, 0.24)",
        heading: "#172033",
        body: "#475569",
        muted: "#475569",
        divider: "#cbd5e1",
        link: "#1d4ed8",
        shadow: "0 4px 14px rgba(15, 23, 42, 0.06)",
      };

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    return () =>
      window.removeEventListener("resize", handleResize);
  }, []);

  // Create a multiplayer room in Firebase
  // Create a multiplayer room in Firebase
const handleCreateRoom = async () => {
  try {
    console.log("========== HOME: CREATE ROOM STARTED ==========");

    setCreatingRoom(true);
    setRoomError("");

    // Generate a unique 6-digit room code
    const roomCode = String(
      Math.floor(100000 + Math.random() * 900000)
    );

    console.log("Generated Room Code:", roomCode);

    // Create room in Firebase
    console.log("Calling createRoom()...");

    const result = await createRoom(roomCode);

    console.log("Firebase Create Room Response:", result);

    if (!result || !result.success || !result.roomCode) {
      throw new Error("Room creation failed. Invalid Firebase response.");
    }

    const createdRoomCode = result.roomCode;

    console.log("Room Created Successfully:", createdRoomCode);

    // Store room code locally
    localStorage.setItem("tambolaRoomCode", createdRoomCode);

    console.log("Room Code Saved to Local Storage");

    // Navigate to number generator
    console.log("Navigating to Generator Page...");

    navigate(`/generator/${createdRoomCode}`);

  } catch (error) {
    console.error("========== ROOM CREATION FAILED ==========");
    console.error("Error Message:", error.message);
    console.error("Full Error:", error);

    setRoomError(
      error.message || "Unable to create room. Please try again."
    );

  } finally {
    setCreatingRoom(false);
    console.log("========== CREATE ROOM PROCESS COMPLETED ==========");
  }
};
  return (
    <div className="glass-page home-page"
      style={{
        minHeight: "100vh",
        background: "transparent",
        color: palette.pageText,
        fontFamily: "sans-serif",
        padding: screenWidth < 600 ? "15px" : "40px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflowX: "hidden",
        boxSizing: "border-box",
      }}
    >
      <div className="glass-panel home-panel"
        style={{
          width: "100%",
          maxWidth: "1100px",
          background: palette.panel,
          border: `1px solid ${palette.panelBorder}`,
          borderRadius: screenWidth < 600 ? "16px" : "24px",
          padding: screenWidth < 600 ? "20px" : "40px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
          boxSizing: "border-box",
          transition: "background 180ms ease, color 180ms ease, border-color 180ms ease",
        }}
      >
        {/* TITLE */}
        <div style={{ marginBottom: "30px" }}>
          <h1
            style={{
              fontSize: screenWidth < 600 ? "34px" : "52px",
              marginBottom: "10px",
              fontWeight: "750",
              color: palette.heading,
              lineHeight: "1.2",
            }}
          >
           Play Tambola/Housie Online with Friends & Family
          </h1>

          <p
            style={{
              color: palette.body,
              fontSize: screenWidth < 600 ? "15px" : "18px",
              lineHeight: "1.6",
            }}
          >
          Enjoy the excitement of the classic Tambola (Housie) game online! Create your own private game room,
           invite friends and family using a simple room code, generate tickets, and play together in real time. 
           No complicated setup – just create, invite, and enjoy!
          </p>
        </div>

        {/* BUTTONS */}
        <div
          style={{
            display: "flex",
            flexDirection: screenWidth < 600 ? "column" : "row",
            gap: "20px",
            marginBottom: "25px",
            width: "100%",
          }}
        >

            {/* SOLO NUMBER GENERATOR */}
  <button
    onClick={() => navigate("/generator")}
    style={{
      padding: "15px 28px",
      borderRadius: "12px",
      border: "none",
      background: "#7c3aed",
      color: "white",
      fontSize: "16px",
      fontWeight: "600",
      cursor: "pointer",
      width: screenWidth < 600 ? "100%" : "auto",
    }}
  >
    Solo Number Generator
  </button>
  
          {/* CREATE MULTIPLAYER ROOM */}
          <button
            disabled={creatingRoom}
            onClick={handleCreateRoom}
            style={{
              padding: screenWidth < 600 ? "14px" : "15px 28px",
              borderRadius: "12px",
              border: "none",
              background: creatingRoom ? "#64748b" : "#2563eb",
              color: "white",
              fontSize: screenWidth < 600 ? "15px" : "16px",
              fontWeight: "600",
              cursor: creatingRoom ? "not-allowed" : "pointer",
              transition: "0.3s",
              width: screenWidth < 600 ? "100%" : "auto",
            }}
            onMouseEnter={(e) => {
              if (!creatingRoom) {
                e.currentTarget.style.background = "#3b82f6";
              }
            }}
            onMouseLeave={(e) => {
              if (!creatingRoom) {
                e.currentTarget.style.background = "#2563eb";
              }
            }}
          >
            {creatingRoom ? "Creating Room..." : "Create Multiplayer Room"}
          </button>

          {/* OPEN TICKETS / JOIN ROOM */}
          <button
            onClick={() => navigate("/ticket")}
            style={{
              padding: screenWidth < 600 ? "14px" : "15px 28px",
              borderRadius: "12px",
              border: "none",
              background: "#16a34a",
              color: "white",
              fontSize: screenWidth < 600 ? "15px" : "16px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "0.3s",
              width: screenWidth < 600 ? "100%" : "auto",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#22c55e";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#16a34a";
            }}
          >
            Open Tickets / Join Room
          </button>
        </div>

        {/* ROOM ERROR */}
        {roomError && (
          <div
            role="alert"
            style={{
              background: "#7f1d1d",
              color: "#fecaca",
              padding: "12px 16px",
              borderRadius: "10px",
              marginBottom: "25px",
            }}
          >
            {roomError}
          </div>
        )}

        {/* INSTRUCTIONS */}
        <div
          style={{
            background: palette.section,
            border: `1px solid ${palette.sectionBorder}`,
            borderRadius: screenWidth < 600 ? "14px" : "18px",
            padding: screenWidth < 600 ? "20px" : "30px",
          }}
        >
          <h2
  style={{
    fontSize: screenWidth < 600 ? "26px" : "36px",
    color: palette.heading,
    fontWeight: "750",
    marginBottom: "25px",
  }}
>
  How To Play
</h2>

<div
  style={{
    display: "grid",
    gridTemplateColumns:
      screenWidth < 700
        ? "1fr"
        : "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "20px",
  }}
>
  {[
  {
    title: "1. Play Tambola Your Way",
    text: "Enjoy a classic Tambola or Housie game online! Play solo using the automatic number generator or create a multiplayer room to enjoy the game with friends and family."
  },
  {
    title: "2. Create Your Private Game Room",
    text: "Start your own online Tambola game in seconds. Create a private multiplayer room and get a unique six-digit room code to invite your friends, family, or colleagues."
  },
  {
    title: "3. Invite Friends & Family",
    text: "Share your Tambola game invitation through WhatsApp, Telegram, or any messaging app. Players can join your online Housie game from their own phones, tablets, or computers."
  },
  {
    title: "4. Join & Generate Tambola Tickets",
    text: "Enter the room code, join the multiplayer game, and generate your Tambola tickets. Get ready to mark your numbers and compete with other players."
  },
  {
    title: "5. Enjoy Live Number Calling",
    text: "Let the host call numbers manually or use automatic number generation. Follow the live number board and stay updated as numbers are called during the game."
  },
  {
    title: "6. Claim Your Winning Prizes",
    text: "Keep an eye on your ticket and claim exciting Tambola prizes such as Jaldi 5, First Line, Second Line, Last Line, and Full House when you qualify."
  },
  {
    title: "7. Celebrate Every Winner",
    text: "Experience the excitement of winning! Watch the winners' celebration screen and see the winning players announced during your multiplayer Tambola game."
  },
  {
    title: "8. Start Another Tambola Party",
    text: "The fun doesn't have to end! Return to the home page, create another multiplayer room, invite more people, and enjoy another exciting game of online Housie."
  }
].map((item, index) => (
    <div
      key={index}
      style={{
        background: palette.card,
        border: `1px solid ${palette.cardBorder}`,
        boxShadow: palette.shadow,
        padding: screenWidth < 600 ? "18px" : "20px",
        borderRadius: "14px",
        boxSizing: "border-box",
      }}
    >
      <h3
        style={{
          fontSize: screenWidth < 600 ? "18px" : "20px",
          color: palette.heading,
          fontWeight: "700",
          marginBottom: "10px",
          lineHeight: "1.4",
        }}
      >
        {item.title}
      </h3>

      <p
        style={{
          color: palette.body,
          lineHeight: "1.7",
          fontSize: screenWidth < 600 ? "14px" : "15px",
        }}
      >
        {item.text}
      </p>
    </div>
  ))}
</div>
        </div>

        {/* FOOTER */}
        <div
          style={{
            marginTop: "40px",
            paddingTop: "20px",
            borderTop: `1px solid ${palette.divider}`,
            textAlign: "center",
          }}
        >
          <h3
            style={{
              marginBottom: "10px",
              color: palette.heading,
              fontSize: screenWidth < 600 ? "20px" : "24px",
            }}
          >
            Credits & Contact
          </h3>

          <p
            style={{
              color: palette.muted,
              marginBottom: "8px",
              fontSize: screenWidth < 600 ? "14px" : "16px",
            }}
          >
            Developed by Toothless Games
          </p>

          <p
            style={{
              color: palette.muted,
              marginBottom: "8px",
              fontSize: screenWidth < 600 ? "14px" : "16px",
            }}
          >
            Tambola Multiplayer Web Application
          </p>

          
           
  
  <a
    href="mailto:akhilmohammad41@gmail.com"
    style={{
      color: palette.link,
      textDecoration: "none",
      fontWeight: "600",
      cursor: "pointer",
    }}
  >
    Reach Out
  </a>

         
        </div>
      </div>
    </div>
  );
}