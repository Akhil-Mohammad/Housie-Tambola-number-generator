import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Home() {
  const navigate = useNavigate();

  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    return () =>
      window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "white",
        fontFamily: "sans-serif",

        padding:
          screenWidth < 600 ? "15px" : "40px",

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

          borderRadius:
            screenWidth < 600 ? "16px" : "24px",

          padding:
            screenWidth < 600 ? "20px" : "40px",

          boxShadow:
            "0 10px 30px rgba(0,0,0,0.4)",

          boxSizing: "border-box",
        }}
      >
        {/* TITLE */}
        <div style={{ marginBottom: "30px" }}>
          <h1
            style={{
              fontSize:
                screenWidth < 600 ? "34px" : "52px",

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

              fontSize:
                screenWidth < 600 ? "15px" : "18px",

              lineHeight: "1.6",
            }}
          >
            Play Tambola with automatic number
            generation and smart tickets.
          </p>
        </div>

        {/* BUTTONS */}
        <div
          style={{
            display: "flex",

            flexDirection:
              screenWidth < 600 ? "column" : "row",

            gap: "20px",

            marginBottom: "40px",

            width: "100%",
          }}
        >
          <button
            onClick={() => navigate("/generator")}
            style={{
              padding:
                screenWidth < 600
                  ? "14px"
                  : "15px 28px",

              borderRadius: "12px",

              border: "none",

              background: "#2563eb",

              color: "white",

              fontSize:
                screenWidth < 600 ? "15px" : "16px",

              fontWeight: "600",

              cursor: "pointer",

              transition: "0.3s",

              width:
                screenWidth < 600
                  ? "100%"
                  : "auto",
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
              padding:
                screenWidth < 600
                  ? "14px"
                  : "15px 28px",

              borderRadius: "12px",

              border: "none",

              background: "#16a34a",

              color: "white",

              fontSize:
                screenWidth < 600 ? "15px" : "16px",

              fontWeight: "600",

              cursor: "pointer",

              transition: "0.3s",

              width:
                screenWidth < 600
                  ? "100%"
                  : "auto",
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

            borderRadius:
              screenWidth < 600 ? "14px" : "18px",

            padding:
              screenWidth < 600 ? "20px" : "30px",
          }}
        >
          <h2
            style={{
              marginBottom: "20px",

              fontSize:
                screenWidth < 600 ? "24px" : "30px",
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
                title:
                  "1. Open On Multiple Devices",
                text:
                  "Open the same Tambola application link on multiple devices.",
              },
              {
                title:
                  "2. Use One Device As Caller",
                text:
                  "Use one device as the Number Generator to generate and announce numbers.",
              },
              {
                title:
                  "3. Use Other Devices For Tickets",
                text:
                  "Open the Tickets page on other devices and mark numbers as they are called.",
              },
              {
                title: "4. Win The Game",
                text:
                  "Complete rows or full house according to your Tambola game rules.",
              },
            ].map((item, index) => (
              <div
                key={index}
                style={{
                  background: "#1e293b",

                  padding:
                    screenWidth < 600
                      ? "18px"
                      : "20px",

                  borderRadius: "14px",

                  boxSizing: "border-box",
                }}
              >
                <h3
                  style={{
                    fontSize:
                      screenWidth < 600
                        ? "18px"
                        : "20px",

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

                    fontSize:
                      screenWidth < 600
                        ? "14px"
                        : "15px",
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

              fontSize:
                screenWidth < 600 ? "20px" : "24px",
            }}
          >
            Credits & Contact
          </h3>

          <p
            style={{
              color: "#94a3b8",

              marginBottom: "8px",

              fontSize:
                screenWidth < 600 ? "14px" : "16px",
            }}
          >
            Developed by Akhil Mohammad
          </p>

          <p
            style={{
              color: "#94a3b8",

              marginBottom: "8px",

              fontSize:
                screenWidth < 600 ? "14px" : "16px",
            }}
          >
            Tambola Multiplayer Web Application
          </p>

          <p
            style={{
              color: "#cbd5e1",

              fontSize:
                screenWidth < 600 ? "14px" : "16px",

              wordBreak: "break-word",
            }}
          >
            Contact:
            akhilmohammad41@gmail.com
          </p>
        </div>
      </div>
    </div>
  );
}