import React, { useState, useEffect, useRef } from "react";

export default function HousieGenerator() {
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

    const msg = new SpeechSynthesisUtterance(`${num}`);
    msg.rate = 0.85;

    const voices = window.speechSynthesis.getVoices();
    msg.voice = voices.find((v) => v.lang === "en-IN") || voices[0];

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
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "15px",
            background: "green",
            color: "white",
            borderRadius: "8px",
          }}
        >
          Generate Number
        </button>

        <button
          onClick={autoPlay ? stopAutoPlay : startAutoPlay}
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "10px",
            background: "#555",
            color: "white",
            borderRadius: "8px",
          }}
        >
          {autoPlay ? "Pause Auto" : "Start Auto"}
        </button>

        <button
          onClick={resetGame}
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "10px",
            background: "red",
            color: "white",
            borderRadius: "8px",
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

          <button
            onClick={() => setDarkMode(!darkMode)}
            style={{
              padding: "6px 12px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              background: darkMode ? "#d1deeb" : "#111",
              color: darkMode ? "#111" : "#fff",
            }}
          >
              {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
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