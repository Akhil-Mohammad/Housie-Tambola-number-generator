import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "white",
        fontFamily: "sans-serif",
        padding: "40px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1100px",
          background: "#1e293b",
          borderRadius: "24px",
          padding: "40px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
        }}
      >
        {/* TITLE */}
        <div style={{ marginBottom: "30px" }}>
          <h1
            style={{
              fontSize: "52px",
              marginBottom: "10px",
              fontWeight: "700",
            }}
          >
            Tambola Game
          </h1>

          <p
            style={{
              color: "#cbd5e1",
              fontSize: "18px",
            }}
          >
            Play Tambola with automatic number generation and smart tickets.
          </p>
        </div>

        {/* BUTTONS */}
        <div
          style={{
            display: "flex",
            gap: "20px",
            marginBottom: "40px",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => navigate("/generator")}
            style={{
              padding: "15px 28px",
              borderRadius: "12px",
              border: "none",
              background: "#2563eb",
              color: "white",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "0.3s",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "#3b82f6";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "#2563eb";
            }}
          >
            Open Number Generator
          </button>

          <button
            onClick={() => navigate("/ticket")}
            style={{
              padding: "15px 28px",
              borderRadius: "12px",
              border: "none",
              background: "#16a34a",
              color: "white",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "0.3s",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "#22c55e";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "#16a34a";
            }}
          >
            Open Tickets Page
          </button>
        </div>

        {/* INSTRUCTIONS */}
        <div
          style={{
            background: "#0f172a",
            borderRadius: "18px",
            padding: "30px",
          }}
        >
          <h2
            style={{
              marginBottom: "20px",
              fontSize: "30px",
            }}
          >
            How To Play
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "20px",
            }}
          >
            <div
              style={{
                background: "#1e293b",
                padding: "20px",
                borderRadius: "14px",
              }}
            >
              <h3>1. Open On Multiple Devices</h3>

              <p style={{ color: "#cbd5e1" }}>
                Open the same Tambola application link on multiple devices.
              </p>
            </div>

            <div
              style={{
                background: "#1e293b",
                padding: "20px",
                borderRadius: "14px",
              }}
            >
              <h3>2. Use One Device As Caller</h3>

              <p style={{ color: "#cbd5e1" }}>
                Use one device as the Number Generator to generate and announce numbers.
              </p>
            </div>

            <div
              style={{
                background: "#1e293b",
                padding: "20px",
                borderRadius: "14px",
              }}
            >
              <h3>3. Use Other Devices For Tickets</h3>

              <p style={{ color: "#cbd5e1" }}>
                Open the Tickets page on other devices and mark numbers as they are called.
              </p>
            </div>

            <div
              style={{
                background: "#1e293b",
                padding: "20px",
                borderRadius: "14px",
              }}
            >
              <h3>4. Win The Game</h3>

              <p style={{ color: "#cbd5e1" }}>
                Complete rows or full house according to your Tambola game rules.
              </p>
            </div>
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
            }}
          >
            Credits & Contact
          </h3>

          <p
            style={{
              color: "#94a3b8",
              marginBottom: "8px",
            }}
          >
            Developed by Akhil Mohammad
          </p>

          <p
            style={{
              color: "#94a3b8",
              marginBottom: "8px",
            }}
          >
            Tambola Multiplayer Web Application
          </p>

          <p
            style={{
              color: "#cbd5e1",
            }}
          >
            Contact: akhilmohammad41@gmail.com
          </p>
        </div>
      </div>
    </div>
  );
}