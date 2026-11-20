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
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "white",
        fontFamily: "sans-serif",
        padding: screenWidth < 600 ? "15px" : "40px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflowX: "hidden",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1100px",
          background: "#1e293b",
          borderRadius: screenWidth < 600 ? "16px" : "24px",
          padding: screenWidth < 600 ? "20px" : "40px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
          boxSizing: "border-box",
        }}
      >
        {/* TITLE */}
        <div style={{ marginBottom: "30px" }}>
          <h1
            style={{
              fontSize: screenWidth < 600 ? "34px" : "52px",
              marginBottom: "10px",
              fontWeight: "700",
              lineHeight: "1.2",
            }}
          >
            Tambola Game
          </h1>

          <p
            style={{
              color: "#cbd5e1",
              fontSize: screenWidth < 600 ? "15px" : "18px",
              lineHeight: "1.6",
            }}
          >
            Play Tambola with automatic number generation and smart tickets.
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
            background: "#0f172a",
            borderRadius: screenWidth < 600 ? "14px" : "18px",
            padding: screenWidth < 600 ? "20px" : "30px",
          }}
        >
          <h2
            style={{
              marginBottom: "20px",
              fontSize: screenWidth < 600 ? "24px" : "30px",
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
                title: "1. Create A Room",
                text:
                  "Create a multiplayer room. A unique room code will be generated automatically.",
              },
              {
                title: "2. Share Room Code",
                text:
                  "Share the generated room code with your friends and family.",
              },
              {
                title: "3. Join The Room",
                text:
                  "Open the Tickets page on other devices and enter the room code.",
              },
              {
                title: "4. Play Together",
                text:
                  "Use one device as the caller. All players in the room receive called numbers in real time.",
              },
            ].map((item, index) => (
              <div
                key={index}
                style={{
                  background: "#1e293b",
                  padding: screenWidth < 600 ? "18px" : "20px",
                  borderRadius: "14px",
                  boxSizing: "border-box",
                }}
              >
                <h3
                  style={{
                    fontSize: screenWidth < 600 ? "18px" : "20px",
                    marginBottom: "10px",
                    lineHeight: "1.4",
                  }}
                >
                  {item.title}
                </h3>

                <p
                  style={{
                    color: "#cbd5e1",
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
            borderTop: "1px solid #334155",
            textAlign: "center",
          }}
        >
          <h3
            style={{
              marginBottom: "10px",
              color: "#f8fafc",
              fontSize: screenWidth < 600 ? "20px" : "24px",
            }}
          >
            Credits & Contact
          </h3>

          <p
            style={{
              color: "#94a3b8",
              marginBottom: "8px",
              fontSize: screenWidth < 600 ? "14px" : "16px",
            }}
          >
            Developed by Akhil Mohammad
          </p>

          <p
            style={{
              color: "#94a3b8",
              marginBottom: "8px",
              fontSize: screenWidth < 600 ? "14px" : "16px",
            }}
          >
            Tambola Multiplayer Web Application
          </p>

          <p
            style={{
              color: "#cbd5e1",
              fontSize: screenWidth < 600 ? "14px" : "16px",
              wordBreak: "break-word",
            }}
          >
            Contact: akhilmohammad41@gmail.com
          </p>
        </div>
      </div>
    </div>
  );
}