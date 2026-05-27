// import React, { useState, useEffect, useRef } from "react";
// import { useNavigate } from "react-router-dom";

// export default function NumberGenerator() {
//   const numbers = Array.from({ length: 90 }, (_, i) => i + 1);

//   const [generated, setGenerated] = useState([]);
//   const [current, setCurrent] = useState(null);

//   const [autoPlay, setAutoPlay] = useState(false);
//   const [intervalTime, setIntervalTime] = useState(3000);
//   const [soundOn, setSoundOn] = useState(true);

//   const [darkMode, setDarkMode] = useState(() => {
//     const saved = localStorage.getItem("theme");
//     return saved ? JSON.parse(saved) : true;
//   });

//   const [screenWidth, setScreenWidth] = useState(window.innerWidth);

//   useEffect(() => {
//     localStorage.setItem("theme", JSON.stringify(darkMode));
//   }, [darkMode]);

//   // RESPONSIVE RESIZE LISTENER
//   useEffect(() => {
//     const handleResize = () => {
//       setScreenWidth(window.innerWidth);
//     };

//     window.addEventListener("resize", handleResize);

//     return () =>
//       window.removeEventListener("resize", handleResize);
//   }, []);

//   const intervalRef = useRef(null);

//   const navigate = useNavigate();

//   const theme = {
//     background: darkMode ? "#0f172a" : "#ccd3e0",
//     card: darkMode ? "#1e293b" : "#ced5e9",
//     text: darkMode ? "#f1f5f9" : "#111827",
//     subText: darkMode ? "#94a3b8" : "#555",
//     primary: "#3b82f6",
//     numberBox: darkMode ? "#334155" : "#eef1f6",
//     shadow: darkMode
//       ? "0 4px 20px rgba(0,0,0,0.15)"
//       : "0 6px 20px rgba(0,0,0,0.20)",
//   };

//   const lastFive = generated.slice(-5).reverse();

//   const speakNumber = (num) => {
//     if (!soundOn) return;

//     window.speechSynthesis.cancel();

//     let speechText = "";

//     if (num >= 1 && num <= 9) {
//       const words = [
//         "",
//         "one",
//         "two",
//         "three",
//         "four",
//         "five",
//         "six",
//         "seven",
//         "eight",
//         "nine",
//       ];

//       speechText = `number ${words[num]}`;
//     } else {
//       const digits = num
//         .toString()
//         .split("")
//         .join(" ");

//       speechText = `${digits} ... ${num}`;
//     }

//     const msg = new SpeechSynthesisUtterance(speechText);

//     msg.rate = 0.75;
//     msg.pitch = 1;

//     const voices = window.speechSynthesis.getVoices();

//     msg.voice =
//       voices.find((v) => v.lang === "en-IN") ||
//       voices.find((v) => v.lang.startsWith("en")) ||
//       voices[0];

//     window.speechSynthesis.speak(msg);
//   };

//   const generateNumber = () => {
//     setGenerated((prev) => {
//       if (prev.length >= 90) return prev;

//       const remaining = numbers.filter((n) => !prev.includes(n));

//       if (remaining.length === 0) return prev;

//       const next =
//         remaining[Math.floor(Math.random() * remaining.length)];

//       setCurrent(next);

//       speakNumber(next);

//       return [...prev, next];
//     });
//   };

//   const startAutoPlay = () => {
//     if (intervalRef.current) return;

//     intervalRef.current = setInterval(generateNumber, intervalTime);

//     setAutoPlay(true);
//   };

//   const stopAutoPlay = () => {
//     clearInterval(intervalRef.current);
//     intervalRef.current = null;
//     setAutoPlay(false);
//   };

//   useEffect(() => {
//     if (autoPlay) {
//       stopAutoPlay();
//       startAutoPlay();
//     }
//   }, [intervalTime]);

//   useEffect(() => {
//     return () => clearInterval(intervalRef.current);
//   }, []);

//   const resetGame = () => {
//     stopAutoPlay();
//     setGenerated([]);
//     setCurrent(null);
//     window.speechSynthesis.cancel();
//   };

//   const cardStyle = {
//     background: theme.card,
//     borderRadius: "16px",
//     padding: "20px",
//     boxShadow: theme.shadow,
//     color: theme.text,
//     transition: "all 0.3s ease",
//   };

//   const darkButtonStyle = {
//     padding: "10px 16px",
//     borderRadius: "8px",
//     border: "none",
//     cursor: "pointer",
//     background: "#1e293b",
//     color: "#ffffff",
//     transition: "all 0.3s ease",
//   };

//   const greenButtonStyle = {
//     width: "100%",
//     padding: "12px",
//     marginTop: "15px",
//     background: "green",
//     color: "white",
//     borderRadius: "8px",
//     border: "none",
//     cursor: "pointer",
//     transition: "all 0.3s ease",
//   };

//   const grayButtonStyle = {
//     width: "100%",
//     padding: "12px",
//     marginTop: "10px",
//     background: "#555",
//     color: "white",
//     borderRadius: "8px",
//     border: "none",
//     cursor: "pointer",
//     transition: "all 0.3s ease",
//   };

//   const redButtonStyle = {
//     width: "100%",
//     padding: "12px",
//     marginTop: "10px",
//     background: "red",
//     color: "white",
//     borderRadius: "8px",
//     border: "none",
//     cursor: "pointer",
//     transition: "all 0.3s ease",
//   };

//   return (
//     <div
//       style={{
//         display: "flex",
//         flexDirection: screenWidth < 900 ? "column" : "row",
//         gap: "20px",
//         padding: screenWidth < 600 ? "10px" : "20px",
//         background: theme.background,
//         minHeight: "100vh",
//         transition: "all 0.3s ease",
//         overflowX: "hidden",
//         width: "100%",
//         boxSizing: "border-box",
//       }}
//     >
//       {/* LEFT CARD */}
//       <div
//         style={{
//           width: screenWidth < 900 ? "100%" : "300px",
//           ...cardStyle,
//           textAlign: "center",
//           boxSizing: "border-box",
//         }}
//       >
//         <p style={{ color: theme.subText }}>Current Number</p>

//         <div
//           style={{
//             width: screenWidth < 600 ? "100px" : "125px",
//             height: screenWidth < 600 ? "100px" : "125px",
//             margin: "20px auto",
//             borderRadius: "50%",
//             background: theme.primary,
//             color: "white",
//             fontSize: screenWidth < 600 ? "32px" : "40px",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
//           }}
//         >
//           {current || "-"}
//         </div>

//         <button
//           onClick={generateNumber}
//           disabled={autoPlay}
//           style={greenButtonStyle}
//           onMouseEnter={(e) => {
//             e.target.style.background = "#22c55e";
//             e.target.style.transform = "scale(1.02)";
//           }}
//           onMouseLeave={(e) => {
//             e.target.style.background = "green";
//             e.target.style.transform = "scale(1)";
//           }}
//         >
//           Generate Number
//         </button>

//         <button
//           onClick={autoPlay ? stopAutoPlay : startAutoPlay}
//           style={grayButtonStyle}
//           onMouseEnter={(e) => {
//             e.target.style.background = "#94a3b8";
//             e.target.style.color = "#111";
//             e.target.style.transform = "scale(1.02)";
//           }}
//           onMouseLeave={(e) => {
//             e.target.style.background = "#555";
//             e.target.style.color = "#fff";
//             e.target.style.transform = "scale(1)";
//           }}
//         >
//           {autoPlay ? "Pause Auto" : "Start Auto"}
//         </button>

//         <button
//           onClick={resetGame}
//           style={redButtonStyle}
//           onMouseEnter={(e) => {
//             e.target.style.background = "#f87171";
//             e.target.style.transform = "scale(1.02)";
//           }}
//           onMouseLeave={(e) => {
//             e.target.style.background = "red";
//             e.target.style.transform = "scale(1)";
//           }}
//         >
//           Reset
//         </button>

//         <p style={{ marginTop: "10px", color: theme.subText }}>
//           Numbers Generated: {generated.length} / 90
//         </p>

//         <label>
//           <input
//             type="checkbox"
//             checked={soundOn}
//             onChange={() => setSoundOn(!soundOn)}
//           />
//           Sound On
//         </label>

//         <div style={{ marginTop: "15px" }}>
//           <p>Speed: {intervalTime / 1000}s</p>

//           <input
//             type="range"
//             min="2000"
//             max="8000"
//             step="500"
//             value={intervalTime}
//             onChange={(e) => setIntervalTime(Number(e.target.value))}
//             style={{ width: "100%" }}
//           />
//         </div>

//         <h4>Last 5 Numbers</h4>

//         <div
//           style={{
//             display: "flex",
//             gap: "10px",
//             justifyContent: "center",
//             flexWrap: "wrap",
//           }}
//         >
//           {lastFive.map((num, index) => (
//             <div
//               key={index}
//               style={{
//                 width: "40px",
//                 height: "40px",
//                 borderRadius: "50%",
//                 background: index === 0 ? theme.primary : theme.numberBox,
//                 color: index === 0 ? "white" : theme.text,
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//                 fontWeight: "bold",
//               }}
//             >
//               {num}
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* RIGHT CARD */}
//       <div
//         style={{
//           flex: 1,
//           width: "100%",
//           maxWidth: "100%",
//           overflowX: "hidden",
//           boxSizing: "border-box",
//           ...cardStyle,
//         }}
//       >
//         {/* HEADER */}
//         <div
//           style={{
//             display: "flex",
//             flexDirection: screenWidth < 700 ? "column" : "row",
//             justifyContent: "space-between",
//             alignItems:
//               screenWidth < 700 ? "flex-start" : "center",
//             gap: "15px",
//             marginBottom: "15px",
//           }}
//         >
//           <h2
//             style={{
//               fontSize: screenWidth < 600 ? "18px" : "24px",
//               fontWeight: "600",
//             }}
//           >
//             Housie/Tambola Number Generator
//           </h2>

//           <div
//             style={{
//               display: "flex",
//               flexWrap: "wrap",
//               alignItems: "center",
//               gap: "10px",
//               width: screenWidth < 700 ? "100%" : "auto",
//             }}
//           >
//             <button
//               onClick={() => {
//                 const confirmLeave = window.confirm(
//                   "You will lose numbers if you are in middle of the Game. Go back to home?"
//                 );

//                 if (confirmLeave) {
//                   navigate("/");
//                 }
//               }}
//               style={darkButtonStyle}
//               onMouseEnter={(e) => {
//                 e.target.style.background = "#dbeafe";
//                 e.target.style.color = "#111";
//               }}
//               onMouseLeave={(e) => {
//                 e.target.style.background = "#1e293b";
//                 e.target.style.color = "#fff";
//               }}
//             >
//               Home
//             </button>

//             <button
//               onClick={() => setDarkMode(!darkMode)}
//               style={darkButtonStyle}
//               onMouseEnter={(e) => {
//                 e.target.style.background = "#dbeafe";
//                 e.target.style.color = "#111";
//               }}
//               onMouseLeave={(e) => {
//                 e.target.style.background = "#1e293b";
//                 e.target.style.color = "#fff";
//               }}
//             >
//               {darkMode ? "Light Mode" : "Dark Mode"}
//             </button>
//           </div>
//         </div>

//         {/* GRID */}
//         <div
//           style={{
//             display: "grid",

//             gridTemplateColumns:
//               screenWidth < 500
//                 ? "repeat(4, 1fr)"
//                 : screenWidth < 800
//                 ? "repeat(6, 1fr)"
//                 : "repeat(10, 1fr)",

//             gap: screenWidth < 600 ? "8px" : "12px",

//             width: "100%",
//             boxSizing: "border-box",
//           }}
//         >
//           {numbers.map((num) => {
//             const isSelected = generated.includes(num);

//             return (
//               <div
//                 key={num}
//                 style={{
//                   padding:
//                     screenWidth < 600 ? "10px" : "12px",

//                   textAlign: "center",

//                   borderRadius:
//                     screenWidth < 600 ? "8px" : "10px",

//                   background: isSelected
//                     ? theme.primary
//                     : theme.numberBox,

//                   color: isSelected ? "white" : theme.text,

//                   fontWeight: "500",

//                   transition: "all 0.2s ease",

//                   transform: isSelected
//                     ? "scale(1.05)"
//                     : "scale(1)",

//                   boxSizing: "border-box",

//                   width: "100%",
//                 }}
//               >
//                 {num}
//               </div>
//             );
//           })}
//         </div>
//       </div>
//     </div>
//   );
// }


import React, {
  useState,
  useEffect,
  useRef,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  ref,
  update,
  onValue,
} from "firebase/database";

import { db } from "../firebase";

export default function NumberGenerator() {
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

  const [autoPlay,
    setAutoPlay] =
    useState(false);

  const [intervalTime,
    setIntervalTime] =
    useState(3000);

  const [soundOn,
    setSoundOn] =
    useState(true);

  const [darkMode,
    setDarkMode] =
    useState(() => {
      const saved =
        localStorage.getItem(
          "theme"
        );

      return saved
        ? JSON.parse(saved)
        : true;
    });

  const [screenWidth,
    setScreenWidth] =
    useState(window.innerWidth);

  // THEME SAVE
  useEffect(() => {
    localStorage.setItem(
      "theme",
      JSON.stringify(darkMode)
    );
  }, [darkMode]);

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

  // CREATE ROOM ONLY ONCE
  useEffect(() => {
    if (!roomCode) return;

    const roomRef = ref(
      db,
      `rooms/${roomCode}`
    );

    onValue(
      roomRef,
      (snapshot) => {
        const data =
          snapshot.val();

        if (!data) {
          update(roomRef, {
            generatedNumbers:
              [],
            currentNumber:
              null,
            players: {},
            roomActive:
              true,
          });
        }
      },
      {
        onlyOnce: true,
      }
    );
  }, [roomCode]);

  // PLAYER COUNT
  useEffect(() => {
    if (!roomCode) return;

    const playersRef = ref(
      db,
      `rooms/${roomCode}/players`
    );

    return onValue(
      playersRef,
      (snapshot) => {
        const data =
          snapshot.val() ||
          {};

        setPlayerCount(
          Object.keys(data)
            .length
        );
      }
    );
  }, [roomCode]);

  // LIVE NUMBER SYNC
  useEffect(() => {
    if (!roomCode) return;

    const roomRef = ref(
      db,
      `rooms/${roomCode}`
    );

    return onValue(
      roomRef,
      (snapshot) => {
        const data =
          snapshot.val();

        if (!data) return;

        setGenerated(
          data.generatedNumbers ||
            []
        );

        setCurrent(
          data.currentNumber ||
            null
        );
      }
    );
  }, [roomCode]);

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

  // GENERATE NUMBER
  const generateNumber =
    () => {
      setGenerated(
        (
          prevGenerated
        ) => {
          if (
            prevGenerated.length >=
            90
          )
            return prevGenerated;

          const remaining =
            numbers.filter(
              (n) =>
                !prevGenerated.includes(
                  n
                )
            );

          if (
            remaining.length ===
            0
          )
            return prevGenerated;

          const next =
            remaining[
              Math.floor(
                Math.random() *
                  remaining.length
              )
            ];

          const updated = [
            ...prevGenerated,
            next,
          ];

          setCurrent(next);

          speakNumber(next);

          update(
            ref(
              db,
              `rooms/${roomCode}`
            ),
            {
              generatedNumbers:
                updated,
              currentNumber:
                next,
            }
          );

          return updated;
        }
      );
    };

  // AUTO PLAY
  const startAutoPlay =
    () => {
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

  useEffect(() => {
    if (autoPlay) {
      stopAutoPlay();

      startAutoPlay();
    }
  }, [intervalTime]);

  useEffect(() => {
    return () =>
      clearInterval(
        intervalRef.current
      );
  }, []);

  // RESET GAME
  const resetGame = () => {
    stopAutoPlay();

    setGenerated([]);

    setCurrent(null);

    update(
      ref(
        db,
        `rooms/${roomCode}`
      ),
      {
        generatedNumbers:
          [],
        currentNumber:
          null,
      }
    );

    window.speechSynthesis.cancel();
  };

  const cardStyle = {
    background: theme.card,

    borderRadius: "16px",

    padding: "20px",

    boxShadow:
      theme.shadow,

    color: theme.text,
  };

  return (
    <div
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

        <button
          onClick={
            generateNumber
          }
          disabled={
            autoPlay
          }
          style={{
            width: "100%",
            padding:
              "12px",
            marginTop:
              "10px",
            background:
              "green",
            color:
              "white",
            borderRadius:
              "8px",
            border:
              "none",
          }}
        >
          Generate Number
        </button>

        <button
          onClick={
            autoPlay
              ? stopAutoPlay
              : startAutoPlay
          }
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
          }}
        >
          {autoPlay
            ? "Pause Auto"
            : "Start Auto"}
        </button>

        <button
          onClick={
            resetGame
          }
          style={{
            width: "100%",
            padding:
              "12px",
            marginTop:
              "10px",
            background:
              "red",
            color:
              "white",
            borderRadius:
              "8px",
            border:
              "none",
          }}
        >
          Reset
        </button>

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
            display:
              "flex",
            justifyContent:
              "space-between",
            alignItems:
              "center",
            marginBottom:
              "20px",
            flexWrap:
              "wrap",
            gap: "10px",
          }}
        >
          <h2>
            Tambola Number
            Generator
          </h2>

          <div
            style={{
              display:
                "flex",
              gap: "10px",
            }}
          >
            <button
              onClick={() =>
                navigate("/")
              }
            >
              Home
            </button>

            <button
              onClick={() =>
                setDarkMode(
                  !darkMode
                )
              }
            >
              {darkMode
                ? "Light"
                : "Dark"}
            </button>
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