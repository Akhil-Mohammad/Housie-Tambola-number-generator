import React, { useState, useEffect, useRef } from "react";

export default function HousieGenerator() {
  const numbers = Array.from({ length: 90 }, (_, i) => i + 1);

  const [generated, setGenerated] = useState([]);
  const [current, setCurrent] = useState(null);

  const [autoPlay, setAutoPlay] = useState(false);
  const [intervalTime, setIntervalTime] = useState(3000);
  const [soundOn, setSoundOn] = useState(true);

  const intervalRef = useRef(null);

  // 🎯 Derived last 5 numbers
  const lastFive = generated.slice(-5).reverse();

  // 🎨 Reusable card style
  const cardStyle = {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
  };

  // 🔊 Format speech
  const formatTambolaCall = (num) => {
    const tens = Math.floor(num / 10);
    const ones = num % 10;

    if (num < 10) return `${num}`;
    if (ones === 0) return `${num}`;

    return `${tens} and ${ones}... ${num}`;
  };

  // 🔊 Speak
  const speakNumber = (num) => {
    if (!soundOn) return;

    const msg = new SpeechSynthesisUtterance(formatTambolaCall(num));
    msg.rate = 0.85;

    const voices = window.speechSynthesis.getVoices();
    msg.voice = voices.find((v) => v.lang === "en-IN") || voices[0];

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(msg);
  };

  // 🎲 Generate
  const generateNumber = () => {
    if (generated.length >= 90) return;

    const remaining = numbers.filter((n) => !generated.includes(n));
    const next =
      remaining[Math.floor(Math.random() * remaining.length)];

    setGenerated((prev) => [...prev, next]);
    setCurrent(next);

    setTimeout(() => speakNumber(next), 300);
  };

  // ▶️ Auto
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

  return (
    <div
      style={{
        display: "flex",
        gap: "30px",
        padding: "20px",
        background: "#f5f7fb",
        minHeight: "100vh",
      }}
    >
      {/* LEFT CARD */}
      <div style={{ width: "300px", ...cardStyle, textAlign: "center" }}>
        <h2 style={{ marginBottom: "10px" }}>Housie Generator</h2>

        <p>Current Number</p>

        <div
          style={{
            width: "150px",
            height: "150px",
            margin: "20px auto",
            borderRadius: "50%",
            background: "#2f6fed",
            color: "white",
            fontSize: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 10px rgba(47,111,237,0.4)",
          }}
        >
          {current || "-"}
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
                background: index === 0 ? "#2f6fed" : "#444",
                color: "white",
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

        <p style={{ marginTop: "10px" }}>
          Numbers Generated: {generated.length} / 90
        </p>

        {/* Sound */}
        <label>
          <input
            type="checkbox"
            checked={soundOn}
            onChange={() => setSoundOn(!soundOn)}
          />
          Sound On
        </label>

        {/* Speed */}
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
      </div>

      {/* RIGHT CARD */}
      <div style={{ flex: 1, ...cardStyle }}>
        <h2 style={{ marginBottom: "15px" }}>All Numbers</h2>

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
                  background: isSelected ? "#2f6fed" : "#eef1f6",
                  color: isSelected ? "white" : "#333",
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