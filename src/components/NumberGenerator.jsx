import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function NumberGenerator() {
  const numbers = Array.from({ length: 90 }, (_, i) => i + 1);

  const [generated, setGenerated] = useState([]);
  const [current, setCurrent] = useState(null);

  const [autoPlay, setAutoPlay] = useState(false);
  const [intervalTime, setIntervalTime] = useState(3000);
  const [soundOn, setSoundOn] = useState(true);

  // 🌙 Default dark mode + persistence
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem("theme", JSON.stringify(darkMode));
  }, [darkMode]);

  const intervalRef = useRef(null);

  const navigate = useNavigate();


  const theme = {
    background: darkMode ? "#0f172a" : "#ccd3e0",
    card: darkMode ? "#1e293b" : "#ced5e9",
    text: darkMode ? "#f1f5f9" : "#111827",
    subText: darkMode ? "#94a3b8" : "#555",
    primary: "#3b82f6",
    numberBox: darkMode ? "#334155" : "#eef1f6",
    shadow: darkMode
      ? "0 4px 20px rgba(0,0,0,0.15)"
      : "0 6px 20px rgba(0,0,0,0.20)",
  };

  const lastFive = generated.slice(-5).reverse();

  const speakNumber = (num) => {
  if (!soundOn) return;

  const digits = num
    .toString()
    .split("")
    .join(" ");

  const speechText = `${digits} ... ${num}`;

  const msg = new SpeechSynthesisUtterance(speechText);

  msg.rate = 0.75;
  msg.pitch = 1;

  const voices = window.speechSynthesis.getVoices();

  msg.voice =
    voices.find((v) => v.lang === "en-IN") ||
    voices.find((v) => v.lang.startsWith("en")) ||
    voices[0];

  window.speechSynthesis.cancel();

  window.speechSynthesis.speak(msg);
};

  const generateNumber = () => {
    if (generated.length >= 90) return;

    const remaining = numbers.filter((n) => !generated.includes(n));
    const next =
      remaining[Math.floor(Math.random() * remaining.length)];

    setGenerated((prev) => [...prev, next]);
    setCurrent(next);

    setTimeout(() => speakNumber(next), 300);
  };

  const startAutoPlay = () => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(generateNumber, intervalTime);
    setAutoPlay(true);
  };

  const stopAutoPlay = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    setAutoPlay(false);
  };

  useEffect(() => {
    if (autoPlay) {
      stopAutoPlay();
      startAutoPlay();
    }
  }, [intervalTime]);

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  const resetGame = () => {
    stopAutoPlay();
    setGenerated([]);
    setCurrent(null);
    window.speechSynthesis.cancel();
  };

  const cardStyle = {
    background: theme.card,
    borderRadius: "16px",
    padding: "20px",
    boxShadow: theme.shadow,
    color: theme.text,
    transition: "all 0.3s ease",
  };

  const darkButtonStyle = {
  padding: "10px 16px",
  borderRadius: "8px",
  border: "none",
  cursor: "pointer",
  background: "#1e293b",
  color: "#ffffff",
  transition: "all 0.3s ease",
};

const greenButtonStyle = {
  width: "100%",
  padding: "12px",
  marginTop: "15px",
  background: "green",
  color: "white",
  borderRadius: "8px",
  border: "none",
  cursor: "pointer",
  transition: "all 0.3s ease",
};

const grayButtonStyle = {
  width: "100%",
  padding: "12px",
  marginTop: "10px",
  background: "#555",
  color: "white",
  borderRadius: "8px",
  border: "none",
  cursor: "pointer",
  transition: "all 0.3s ease",
};

const redButtonStyle = {
  width: "100%",
  padding: "12px",
  marginTop: "10px",
  background: "red",
  color: "white",
  borderRadius: "8px",
  border: "none",
  cursor: "pointer",
  transition: "all 0.3s ease",
};


  return (
    <div
      style={{
        display: "flex",
        gap: "30px",
        padding: "20px",
        background: theme.background,
        minHeight: "100vh",
        transition: "all 0.3s ease",
      }}
    >
      {/* LEFT CARD */}
      <div style={{ width: "300px", ...cardStyle, textAlign: "center" }}>
        

        <p style={{ color: theme.subText }}>Current Number</p>

        <div
          style={{
            width: "125px",
            height: "125px",
            margin: "20px auto",
            borderRadius: "50%",
            background: theme.primary,
            color: "white",
            fontSize: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}
        >
          {current || "-"}
        </div>

       

        {/* Buttons */}
    <button
  onClick={generateNumber}
  disabled={autoPlay}
  style={greenButtonStyle}
  onMouseEnter={(e) => {
    e.target.style.background = "#22c55e";
    e.target.style.transform = "scale(1.02)";
  }}
  onMouseLeave={(e) => {
    e.target.style.background = "green";
    e.target.style.transform = "scale(1)";
  }}
>
  Generate Number
</button>

<button
  onClick={autoPlay ? stopAutoPlay : startAutoPlay}
  style={grayButtonStyle}
  onMouseEnter={(e) => {
    e.target.style.background = "#94a3b8";
    e.target.style.color = "#111";
    e.target.style.transform = "scale(1.02)";
  }}
  onMouseLeave={(e) => {
    e.target.style.background = "#555";
    e.target.style.color = "#fff";
    e.target.style.transform = "scale(1)";
  }}
>
  {autoPlay ? "Pause Auto" : "Start Auto"}
</button>

<button
  onClick={resetGame}
  style={redButtonStyle}
  onMouseEnter={(e) => {
    e.target.style.background = "#f87171";
    e.target.style.transform = "scale(1.02)";
  }}
  onMouseLeave={(e) => {
    e.target.style.background = "red";
    e.target.style.transform = "scale(1)";
  }}
>
  Reset
</button>

        <p style={{ marginTop: "10px", color: theme.subText }}>
          Numbers Generated: {generated.length} / 90
        </p>

        <label>
          <input
            type="checkbox"
            checked={soundOn}
            onChange={() => setSoundOn(!soundOn)}
          />
          Sound On
        </label>

        <div style={{ marginTop: "15px" }}>
          <p>Speed: {intervalTime / 1000}s</p>
          <input
            type="range"
            min="2000"
            max="8000"
            step="500"
            value={intervalTime}
            onChange={(e) => setIntervalTime(Number(e.target.value))}
          />
        </div>

         {/* Last 5 */}
        <h4>Last 5 Numbers</h4>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          {lastFive.map((num, index) => (
            <div
              key={index}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: index === 0 ? theme.primary : theme.numberBox,
                color: index === 0 ? "white" : theme.text,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
              }}
            >
              {num}
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT CARD */}
      <div style={{ flex: 1, ...cardStyle }}>
        
        {/* HEADER (Title + Toggle) */}
   {/* HEADER (Title + Toggle) */}
<div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px",
  }}
>
  <h2 style={{ fontSize: "24px", fontWeight: "600" }}>
    Housie/Tambola Number Generator
  </h2>

  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "10px",
    }}
  >
    <button
     onClick={() => {
    const confirmLeave = window.confirm(
      "You will lose numbers if you are in middle of the Game. Go back to home?"
    );

    if (confirmLeave) {
      navigate("/");
    }
  }}
      style={darkButtonStyle}
      onMouseEnter={(e) => {
        e.target.style.background = "#dbeafe";
        e.target.style.color = "#111";
      }}
      onMouseLeave={(e) => {
        e.target.style.background = "#1e293b";
        e.target.style.color = "#fff";
      }}
    >
      Home
    </button>

    <button
      onClick={() => setDarkMode(!darkMode)}
      style={darkButtonStyle}
      onMouseEnter={(e) => {
        e.target.style.background = "#dbeafe";
        e.target.style.color = "#111";
      }}
      onMouseLeave={(e) => {
        e.target.style.background = "#1e293b";
        e.target.style.color = "#fff";
      }}
    >
      {darkMode ? "Light Mode" : "Dark Mode"}
    </button>
  </div>
</div>

        {/* GRID */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(10, 1fr)",
            gap: "12px",
          }}
        >
          {numbers.map((num) => {
            const isSelected = generated.includes(num);

            return (
              <div
                key={num}
                style={{
                  padding: "12px",
                  textAlign: "center",
                  borderRadius: "10px",
                  background: isSelected
                    ? theme.primary
                    : theme.numberBox,
                  color: isSelected ? "white" : theme.text,
                  fontWeight: "500",
                  transition: "all 0.2s ease",
                  transform: isSelected ? "scale(1.05)" : "scale(1)",
                }}
              >
                {num}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}