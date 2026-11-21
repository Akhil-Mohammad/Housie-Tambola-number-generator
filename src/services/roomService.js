// // import {
// //   ref,
// //   get,
// //   set,
// //   update,
// //   onValue,
// //   runTransaction,
// // } from "firebase/database";

// // import { db } from "../firebase";

// // // ======================================================
// // // FIREBASE DATABASE CHECK
// // // ======================================================

// // function requireDatabase() {
// //   console.log("========== FIREBASE DATABASE CHECK ==========");

// //   if (!db) {
// //     console.error("Firebase database is NULL.");
// //     throw new Error(
// //       "Firebase is not configured. Check your .env file."
// //     );
// //   }

// //   console.log("Firebase initialized successfully.");
// //   console.log("Database URL:", db.app.options.databaseURL);
// //   console.log("Project ID:", db.app.options.projectId);
// //   console.log("=============================================");
// // }

// // // ======================================================
// // // CONSTANTS
// // // ======================================================

// // const ROOM_CODE_LENGTH = 6;
// // const ROOM_CODE_CHARS = "0123456789";

// // const PRIZE_DEFINITIONS = {
// //   jaldi5: { label: "Jaldi 5", type: "jaldi5" },
// //   firstLine: { label: "First Line", type: "row", rowIndex: 0 },
// //   secondLine: { label: "Second Line", type: "row", rowIndex: 1 },
// //   lastLine: { label: "Last Line", type: "row", rowIndex: 2 },
// // };

// // const REQUIRED_PRIZES = Object.keys(PRIZE_DEFINITIONS);

// // // ======================================================
// // // NORMALIZE ROOM CODE
// // // ======================================================

// // export function normalizeRoomCode(value = "") {
// //   return String(value)
// //     .replace(/\D/g, "")
// //     .slice(0, ROOM_CODE_LENGTH);
// // }

// // // ======================================================
// // // GENERATE ROOM CODE
// // // ======================================================

// // function makeRoomCode() {
// //   const bytes = new Uint8Array(ROOM_CODE_LENGTH);

// //   crypto.getRandomValues(bytes);

// //   return Array.from(
// //     bytes,
// //     (byte) => ROOM_CODE_CHARS[byte % 10]
// //   ).join("");
// // }

// // // ======================================================
// // // CHECK GAME COMPLETION
// // // ======================================================

// // function areAllPrizesClaimed(claims = {}) {
// //   return REQUIRED_PRIZES.every(
// //     (prizeKey) => Boolean(claims[prizeKey])
// //   );
// // }

// // // ======================================================
// // // CREATE ROOM
// // // ======================================================

// // export async function createRoom() {
// //   console.log("\n========== CREATE ROOM STARTED ==========");

// //   requireDatabase();

// //   try {
// //     for (let attempt = 0; attempt < 10; attempt += 1) {
// //       const roomCode = makeRoomCode();

// //       console.log("Attempt:", attempt + 1);
// //       console.log("Generated Room Code:", roomCode);

// //       const roomRef = ref(db, `rooms/${roomCode}`);

// //       const result = await runTransaction(
// //         roomRef,
// //         (currentRoom) => {
// //           if (currentRoom !== null) {
// //             return;
// //           }

// //           return {
// //             roomCode,
// //             roomActive: true,
// //             gameStarted: false,
// //             gameCompleted: false,
// //             createdAt: Date.now(),
// //             generatedNumbers: [],
// //             currentNumber: null,
// //             players: {},
// //             claims: {},
// //           };
// //         }
// //       );

// //       if (result.committed) {
// //         console.log("ROOM CREATED SUCCESSFULLY:", roomCode);

// //         return {
// //           success: true,
// //           roomCode,
// //           data: result.snapshot.val(),
// //         };
// //       }
// //     }

// //     throw new Error(
// //       "Could not generate a unique room code. Please try again."
// //     );

// //   } catch (error) {
// //     console.error("CREATE ROOM FAILED:", error);
// //     throw error;
// //   }
// // }

// // // ======================================================
// // // GET ACTIVE ROOM
// // // ======================================================

// // export async function getActiveRoom(roomCode) {
// //   requireDatabase();

// //   try {
// //     const normalized = normalizeRoomCode(roomCode);

// //     if (normalized.length !== ROOM_CODE_LENGTH) {
// //       throw new Error(
// //         "Room code must contain exactly 6 digits."
// //       );
// //     }

// //     const roomRef = ref(db, `rooms/${normalized}`);
// //     const snapshot = await get(roomRef);

// //     const room = snapshot.val();

// //     if (!room) {
// //       throw new Error(
// //         "Room code not found. Check the code and try again."
// //       );
// //     }

// //     if (room.roomActive !== true) {
// //       throw new Error(
// //         "This room is closed and cannot be joined."
// //       );
// //     }

// //     return room;

// //   } catch (error) {
// //     console.error("GET ACTIVE ROOM FAILED:", error);
// //     throw error;
// //   }
// // }

// // // ======================================================
// // // JOIN ROOM
// // // ======================================================

// // export async function joinRoom(roomCode, playerName, playerId) {
// //   requireDatabase();

// //   try {
// //     const normalized = normalizeRoomCode(roomCode);
// //     const name = String(playerName || "").trim();

// //     if (normalized.length !== ROOM_CODE_LENGTH) {
// //       throw new Error(
// //         "Room code must contain exactly 6 digits."
// //       );
// //     }

// //     if (!name) {
// //       throw new Error(
// //         "Enter your name before joining."
// //       );
// //     }

// //     if (!playerId) {
// //       throw new Error(
// //         "Player ID is missing. Please try again."
// //       );
// //     }

// //     const roomRef = ref(db, `rooms/${normalized}`);

// //     const roomSnapshot = await get(roomRef);

// //     if (!roomSnapshot.exists()) {
// //       throw new Error("Room code not found.");
// //     }

// //     const room = roomSnapshot.val();

// //     if (room.roomActive !== true) {
// //       throw new Error("This room is closed.");
// //     }

// //     if (
// //       room.gameStarted === true ||
// //       room.gameCompleted === true
// //     ) {
// //       throw new Error(
// //         "The game has already started. New joins are closed."
// //       );
// //     }

// //     const players = room.players || {};

// //     if (players[playerId]) {
// //       throw new Error(
// //         "You have already joined this room."
// //       );
// //     }

// //     const playerRef = ref(
// //       db,
// //       `rooms/${normalized}/players/${playerId}`
// //     );

// //     await set(playerRef, {
// //       name,
// //       joinedAt: Date.now(),
// //       ticketGenerated: false,
// //       ticketCount: 0,
// //       status: "active",
// //       dropped: false,
// //     });

// //     console.log(
// //       "PLAYER JOINED SUCCESSFULLY:",
// //       playerId
// //     );

// //     const updatedSnapshot = await get(roomRef);

// //     return {
// //       roomCode: normalized,
// //       room: updatedSnapshot.val(),
// //     };

// //   } catch (error) {
// //     console.error("JOIN ROOM FAILED:", error);
// //     throw error;
// //   }
// // }

// // // ======================================================
// // // SUBSCRIBE TO ROOM
// // // ======================================================

// // export function subscribeToRoom(
// //   roomCode,
// //   callback,
// //   onError
// // ) {
// //   requireDatabase();

// //   const normalized = normalizeRoomCode(roomCode);
// //   const roomPath = `rooms/${normalized}`;

// //   return onValue(
// //     ref(db, roomPath),

// //     (snapshot) => {
// //       callback(snapshot.val());
// //     },

// //     (error) => {
// //       console.error(
// //         "ROOM SUBSCRIPTION FAILED:",
// //         error
// //       );

// //       if (onError) {
// //         onError(error);
// //       }
// //     }
// //   );
// // }

// // // ======================================================
// // // MARK PLAYER AS DROPPED
// // // ======================================================

// // export async function dropPlayer(roomCode, playerId) {
// //   requireDatabase();

// //   const normalized = normalizeRoomCode(roomCode);

// //   if (!playerId) {
// //     throw new Error("Player ID is missing.");
// //   }

// //   const playerRef = ref(
// //     db,
// //     `rooms/${normalized}/players/${playerId}`
// //   );

// //   const result = await runTransaction(
// //     playerRef,
// //     (player) => {
// //       if (!player || player.status === "dropped") {
// //         return;
// //       }

// //       return {
// //         ...player,
// //         status: "dropped",
// //         dropped: true,
// //         droppedAt: Date.now(),
// //         ticketGenerated: false,
// //         ticketCount: 0,
// //         tickets: null,
// //       };
// //     }
// //   );

// //   if (!result.committed) {
// //     const current = result.snapshot.val();

// //     if (!current) {
// //       throw new Error(
// //         "Player record was not found."
// //       );
// //     }
// //   }

// //   return result.snapshot.val();
// // }

// // // ======================================================
// // // CLOSE ROOM
// // // ======================================================

// // export async function closeRoom(roomCode) {
// //   requireDatabase();

// //   try {
// //     const normalized = normalizeRoomCode(roomCode);

// //     await update(
// //       ref(db, `rooms/${normalized}`),
// //       {
// //         roomActive: false,
// //         closedAt: Date.now(),
// //       }
// //     );

// //     console.log("ROOM CLOSED SUCCESSFULLY.");

// //   } catch (error) {
// //     console.error("CLOSE ROOM FAILED:", error);
// //     throw error;
// //   }
// // }

// // // ======================================================
// // // PUBLISH NEXT NUMBER
// // // ======================================================

// // export async function publishNextNumber(roomCode) {
// //   requireDatabase();

// //   try {
// //     const normalized = normalizeRoomCode(roomCode);
// //     const roomRef = ref(db, `rooms/${normalized}`);

// //     const result = await runTransaction(
// //       roomRef,
// //       (room) => {
// //         if (
// //           !room ||
// //           room.roomActive !== true ||
// //           room.gameCompleted === true
// //         ) {
// //           return;
// //         }

// //         const generated = Array.isArray(
// //           room.generatedNumbers
// //         )
// //           ? room.generatedNumbers
// //           : [];

// //         if (generated.length >= 90) {
// //           return;
// //         }

// //         if (room.gameStarted !== true) {
// //           const players =
// //             room.players &&
// //             typeof room.players === "object"
// //               ? Object.values(room.players)
// //               : [];

// //           const activePlayers = players.filter(
// //             (player) =>
// //               player &&
// //               player.status !== "dropped" &&
// //               player.dropped !== true &&
// //               !player.droppedAt
// //           );

// //           if (activePlayers.length < 2) {
// //             return;
// //           }

// //           const pendingPlayers = activePlayers.filter(
// //             (player) =>
// //               player.ticketGenerated !== true
// //           );

// //           if (pendingPlayers.length > 0) {
// //             return;
// //           }
// //         }

// //         const remainingNumbers = Array.from(
// //           { length: 90 },
// //           (_, index) => index + 1
// //         ).filter(
// //           (number) => !generated.includes(number)
// //         );

// //         if (remainingNumbers.length === 0) {
// //           return;
// //         }

// //         const selectedNumber =
// //           remainingNumbers[
// //             Math.floor(
// //               Math.random() * remainingNumbers.length
// //             )
// //           ];

// //         return {
// //           ...room,

// //           gameStarted: true,
// //           gameStartedAt:
// //             room.gameStartedAt || Date.now(),

// //           generatedNumbers: [
// //             ...generated,
// //             selectedNumber,
// //           ],

// //           currentNumber: selectedNumber,
// //         };
// //       }
// //     );

// //     if (!result.committed) {
// //       const currentRoom = result.snapshot.val();

// //       if (!currentRoom) {
// //         throw new Error("Room not found.");
// //       }

// //       if (currentRoom.gameCompleted === true) {
// //         throw new Error(
// //           "Game completed! All prizes have been claimed."
// //         );
// //       }

// //       if (currentRoom.roomActive !== true) {
// //         throw new Error("This room is closed.");
// //       }

// //       if (currentRoom.gameStarted !== true) {
// //         const players =
// //           currentRoom.players &&
// //           typeof currentRoom.players === "object"
// //             ? Object.values(currentRoom.players)
// //             : [];

// //         const activePlayers = players.filter(
// //           (player) =>
// //             player &&
// //             player.status !== "dropped" &&
// //             player.dropped !== true &&
// //             !player.droppedAt
// //         );

// //         if (activePlayers.length < 2) {
// //           throw new Error(
// //             "At least 2 active players are required to start the game."
// //           );
// //         }

// //         const pendingPlayers = activePlayers.filter(
// //           (player) =>
// //             player.ticketGenerated !== true
// //         );

// //         if (pendingPlayers.length > 0) {
// //           const pendingNames = pendingPlayers
// //             .map(
// //               (player) =>
// //                 player.name || "Unknown Player"
// //             )
// //             .join(", ");

// //           throw new Error(
// //             `Waiting for these active players to generate tickets: ${pendingNames}`
// //           );
// //         }
// //       }

// //       return null;
// //     }

// //     const selectedNumber =
// //       result.snapshot.val().currentNumber;

// //     console.log(
// //       "NUMBER PUBLISHED:",
// //       selectedNumber
// //     );

// //     return selectedNumber;

// //   } catch (error) {
// //     console.error(
// //       "PUBLISH NUMBER FAILED:",
// //       error
// //     );
// //     throw error;
// //   }
// // }

// // // ======================================================
// // // RESET ROOM NUMBERS
// // // ======================================================

// // export async function resetRoomNumbers(roomCode) {
// //   requireDatabase();

// //   try {
// //     const normalized = normalizeRoomCode(roomCode);

// //     await update(
// //       ref(db, `rooms/${normalized}`),
// //       {
// //         generatedNumbers: [],
// //         currentNumber: null,
// //         claims: {},
// //         gameStarted: false,
// //         gameStartedAt: null,
// //         gameCompleted: false,
// //         gameCompletedAt: null,
// //       }
// //     );

// //     console.log(
// //       "ROOM NUMBERS AND CLAIMS RESET SUCCESSFULLY."
// //     );

// //   } catch (error) {
// //     console.error("RESET ROOM FAILED:", error);
// //     throw error;
// //   }
// // }

// // // ======================================================
// // // NORMALIZE TICKET DATA
// // // ======================================================

// // function toIndexedArray(value) {
// //   if (Array.isArray(value)) {
// //     return value;
// //   }

// //   if (!value || typeof value !== "object") {
// //     return [];
// //   }

// //   const keys = Object.keys(value);

// //   if (
// //     !keys.length ||
// //     !keys.every((key) => /^\d+$/.test(key))
// //   ) {
// //     return [];
// //   }

// //   const maxIndex = Math.max(
// //     ...keys.map(Number)
// //   );

// //   return Array.from(
// //     { length: maxIndex + 1 },
// //     (_, index) => value[index] ?? ""
// //   );
// // }

// // function toValidNumber(value) {
// //   if (
// //     value === null ||
// //     value === undefined ||
// //     value === ""
// //   ) {
// //     return null;
// //   }

// //   const number = Number(value);

// //   return Number.isInteger(number) &&
// //     number >= 1 &&
// //     number <= 90
// //     ? number
// //     : null;
// // }

// // function normalizeTicket(ticket) {
// //   const rows = toIndexedArray(ticket);

// //   if (rows.length !== 3) {
// //     return null;
// //   }

// //   const normalizedRows = rows.map((row) => {
// //     const cells = toIndexedArray(row);

// //     if (cells.length !== 9) {
// //       return null;
// //     }

// //     return cells.map(toValidNumber);
// //   });

// //   if (normalizedRows.some((row) => !row)) {
// //     return null;
// //   }

// //   if (
// //     normalizedRows.some(
// //       (row) =>
// //         row.filter(
// //           (cell) => cell !== null
// //         ).length !== 5
// //     )
// //   ) {
// //     return null;
// //   }

// //   return normalizedRows;
// // }

// // // ======================================================
// // // CLAIM PRIZE
// // // ======================================================

// // export async function claimPrize(
// //   roomCode,
// //   playerId,
// //   prizeKey
// // ) {
// //   requireDatabase();

// //   const normalized = normalizeRoomCode(roomCode);
// //   const prize = PRIZE_DEFINITIONS[prizeKey];

// //   if (normalized.length !== ROOM_CODE_LENGTH) {
// //     throw new Error(
// //       "Room code must contain exactly 6 digits."
// //     );
// //   }

// //   if (!playerId) {
// //     throw new Error("Player ID is missing.");
// //   }

// //   if (!prize) {
// //     throw new Error("Invalid prize selected.");
// //   }

// //   const roomRef = ref(
// //     db,
// //     `rooms/${normalized}`
// //   );

// //   let failureMessage = "";

// //   const result = await runTransaction(
// //     roomRef,
// //     (room) => {
// //       failureMessage = "";

// //       if (
// //         !room ||
// //         room.roomActive !== true
// //       ) {
// //         failureMessage =
// //           "This room is unavailable.";
// //         return;
// //       }

// //       if (room.gameCompleted === true) {
// //         failureMessage =
// //           "The game has already been completed.";
// //         return;
// //       }

// //       const player =
// //         room.players &&
// //         room.players[playerId];

// //       if (
// //         !player ||
// //         player.status === "dropped" ||
// //         player.dropped === true ||
// //         player.droppedAt
// //       ) {
// //         failureMessage =
// //           "Your player session is not active in this room.";
// //         return;
// //       }

// //       const rawTickets = toIndexedArray(
// //         player.tickets
// //       );

// //       const tickets = rawTickets
// //         .map(normalizeTicket)
// //         .filter(Boolean);

// //       if (!tickets.length) {
// //         failureMessage =
// //           "No valid ticket was found for your player.";
// //         return;
// //       }

// //       const calledValues = toIndexedArray(
// //         room.generatedNumbers
// //       );

// //       const called = new Set(
// //         calledValues
// //           .map(toValidNumber)
// //           .filter(
// //             (number) => number !== null
// //           )
// //       );

// //       if (!called.size) {
// //         failureMessage =
// //           "No numbers have been called yet.";
// //         return;
// //       }

// //       const existingClaims =
// //         room.claims &&
// //         typeof room.claims === "object"
// //           ? room.claims
// //           : {};

// //       const alreadyClaimed =
// //         existingClaims[prizeKey];

// //       if (alreadyClaimed) {
// //         failureMessage =
// //           `${prize.label} has already been claimed by ${
// //             alreadyClaimed.playerName ||
// //             "another player"
// //           }.`;
// //         return;
// //       }

// //       let winningTicketIndex = -1;

// //       for (
// //         let ticketIndex = 0;
// //         ticketIndex < tickets.length;
// //         ticketIndex += 1
// //       ) {
// //         const ticket = tickets[ticketIndex];

// //         let qualifies = false;

// //         if (prize.type === "jaldi5") {
// //           const matchedCount = ticket
// //             .flat()
// //             .filter(
// //               (number) =>
// //                 number !== null &&
// //                 called.has(number)
// //             ).length;

// //           qualifies = matchedCount >= 5;

// //         } else {
// //           const row =
// //             ticket[prize.rowIndex];

// //           const rowNumbers = row.filter(
// //             (number) => number !== null
// //           );

// //           qualifies =
// //             rowNumbers.length === 5 &&
// //             rowNumbers.every(
// //               (number) => called.has(number)
// //             );
// //         }

// //         if (qualifies) {
// //           winningTicketIndex = ticketIndex;
// //           break;
// //         }
// //       }

// //       if (winningTicketIndex < 0) {
// //         failureMessage =
// //           `Your ticket does not qualify for ${prize.label} yet.`;
// //         return;
// //       }

// //       const updatedClaims = {
// //         ...existingClaims,

// //         [prizeKey]: {
// //           prizeKey,
// //           prizeName: prize.label,
// //           playerId,
// //           playerName:
// //             player.name ||
// //             player.playerName ||
// //             "Player",
// //           ticketIndex: winningTicketIndex,
// //           claimedAt: Date.now(),
// //           status: "approved",
// //         },
// //       };

// //       const gameCompleted =
// //         areAllPrizesClaimed(updatedClaims);

// //       return {
// //         ...room,

// //         claims: updatedClaims,

// //         gameCompleted,

// //         gameCompletedAt: gameCompleted
// //           ? room.gameCompletedAt || Date.now()
// //           : null,
// //       };
// //     }
// //   );

// //   if (!result.committed) {
// //     throw new Error(
// //       failureMessage ||
// //       "The claim could not be submitted. Please try again."
// //     );
// //   }

// //   const updatedRoom = result.snapshot.val();

// //   console.log(
// //     "PRIZE CLAIM SUCCESSFUL:",
// //     prize.label
// //   );

// //   if (updatedRoom.gameCompleted) {
// //     console.log(
// //       "GAME COMPLETED! ALL PRIZES HAVE BEEN CLAIMED."
// //     );
// //   }

// //   return {
// //     ...updatedRoom.claims[prizeKey],
// //     gameCompleted: updatedRoom.gameCompleted === true,
// //   };
// // }


// import {
//   ref,
//   get,
//   set,
//   update,
//   onValue,
//   runTransaction,
// } from "firebase/database";

// import { db } from "../firebase";

// // ======================================================
// // FIREBASE DATABASE CHECK
// // ======================================================

// function requireDatabase() {
//   console.log("========== FIREBASE DATABASE CHECK ==========");

//   if (!db) {
//     console.error("Firebase database is NULL.");
//     throw new Error(
//       "Firebase is not configured. Check your .env file."
//     );
//   }

//   console.log("Firebase initialized successfully.");
//   console.log("Database URL:", db.app.options.databaseURL);
//   console.log("Project ID:", db.app.options.projectId);
//   console.log("=============================================");
// }

// // ======================================================
// // CONSTANTS
// // ======================================================

// const ROOM_CODE_LENGTH = 6;
// const ROOM_CODE_CHARS = "0123456789";

// const PRIZE_DEFINITIONS = {
//   jaldi5: { label: "Jaldi 5", type: "jaldi5" },
//   firstLine: { label: "First Line", type: "row", rowIndex: 0 },
//   secondLine: { label: "Second Line", type: "row", rowIndex: 1 },
//   lastLine: { label: "Last Line", type: "row", rowIndex: 2 },
//   fullHouse: { label: "Full House", type: "fullHouse" },
// };

// const REQUIRED_PRIZES = Object.keys(PRIZE_DEFINITIONS);

// // ======================================================
// // NORMALIZE ROOM CODE
// // ======================================================

// export function normalizeRoomCode(value = "") {
//   return String(value)
//     .replace(/\D/g, "")
//     .slice(0, ROOM_CODE_LENGTH);
// }

// // ======================================================
// // GENERATE ROOM CODE
// // ======================================================

// function makeRoomCode() {
//   const bytes = new Uint8Array(ROOM_CODE_LENGTH);

//   crypto.getRandomValues(bytes);

//   return Array.from(
//     bytes,
//     (byte) => ROOM_CODE_CHARS[byte % 10]
//   ).join("");
// }

// // ======================================================
// // CHECK GAME COMPLETION
// // ======================================================

// function getPrizeWinnerList(value) {
//   if (Array.isArray(value)) {
//     return value.filter(Boolean);
//   }

//   // Backward compatibility with existing single-winner records.
//   return value && typeof value === "object" ? [value] : [];
// }

// function areAllPrizesClaimed(claims = {}) {
//   return REQUIRED_PRIZES.every(
//     (prizeKey) =>
//       getPrizeWinnerList(claims[prizeKey]).length > 0
//   );
// }

// // ======================================================
// // CREATE ROOM
// // ======================================================

// export async function createRoom() {
//   console.log("\n========== CREATE ROOM STARTED ==========");

//   requireDatabase();

//   try {
//     for (let attempt = 0; attempt < 10; attempt += 1) {
//       const roomCode = makeRoomCode();

//       console.log("Attempt:", attempt + 1);
//       console.log("Generated Room Code:", roomCode);

//       const roomRef = ref(db, `rooms/${roomCode}`);

//       const result = await runTransaction(
//         roomRef,
//         (currentRoom) => {
//           if (currentRoom !== null) {
//             return;
//           }

//           return {
//             roomCode,
//             roomActive: true,
//             gameStarted: false,
//             gameCompleted: false,
//             createdAt: Date.now(),
//             generatedNumbers: [],
//             currentNumber: null,
//             players: {},
//             claims: {},
//           };
//         }
//       );

//       if (result.committed) {
//         console.log("ROOM CREATED SUCCESSFULLY:", roomCode);

//         return {
//           success: true,
//           roomCode,
//           data: result.snapshot.val(),
//         };
//       }
//     }

//     throw new Error(
//       "Could not generate a unique room code. Please try again."
//     );
//   } catch (error) {
//     console.error("CREATE ROOM FAILED:", error);
//     throw error;
//   }
// }

// // ======================================================
// // GET ACTIVE ROOM
// // ======================================================

// export async function getActiveRoom(roomCode) {
//   requireDatabase();

//   try {
//     const normalized = normalizeRoomCode(roomCode);

//     if (normalized.length !== ROOM_CODE_LENGTH) {
//       throw new Error(
//         "Room code must contain exactly 6 digits."
//       );
//     }

//     const roomRef = ref(db, `rooms/${normalized}`);
//     const snapshot = await get(roomRef);

//     const room = snapshot.val();

//     if (!room) {
//       throw new Error(
//         "Room code not found. Check the code and try again."
//       );
//     }

//     if (room.roomActive !== true) {
//       throw new Error(
//         "This room is closed and cannot be joined."
//       );
//     }

//     return room;
//   } catch (error) {
//     console.error("GET ACTIVE ROOM FAILED:", error);
//     throw error;
//   }
// }

// // ======================================================
// // JOIN ROOM
// // ======================================================

// export async function joinRoom(roomCode, playerName, playerId) {
//   requireDatabase();

//   try {
//     const normalized = normalizeRoomCode(roomCode);
//     const name = String(playerName || "").trim();

//     if (normalized.length !== ROOM_CODE_LENGTH) {
//       throw new Error(
//         "Room code must contain exactly 6 digits."
//       );
//     }

//     if (!name) {
//       throw new Error(
//         "Enter your name before joining."
//       );
//     }

//     if (!playerId) {
//       throw new Error(
//         "Player ID is missing. Please try again."
//       );
//     }

//     const roomRef = ref(db, `rooms/${normalized}`);
//     const roomSnapshot = await get(roomRef);

//     if (!roomSnapshot.exists()) {
//       throw new Error("Room code not found.");
//     }

//     const room = roomSnapshot.val();

//     if (room.roomActive !== true) {
//       throw new Error("This room is closed.");
//     }

//     if (
//       room.gameStarted === true ||
//       room.gameCompleted === true
//     ) {
//       throw new Error(
//         "The game has already started. New joins are closed."
//       );
//     }

//     const players = room.players || {};

//     if (players[playerId]) {
//       throw new Error(
//         "You have already joined this room."
//       );
//     }

//     const playerRef = ref(
//       db,
//       `rooms/${normalized}/players/${playerId}`
//     );

//     await set(playerRef, {
//       name,
//       joinedAt: Date.now(),
//       ticketGenerated: false,
//       ticketCount: 0,
//       status: "active",
//       dropped: false,
//     });

//     console.log(
//       "PLAYER JOINED SUCCESSFULLY:",
//       playerId
//     );

//     const updatedSnapshot = await get(roomRef);

//     return {
//       roomCode: normalized,
//       room: updatedSnapshot.val(),
//     };
//   } catch (error) {
//     console.error("JOIN ROOM FAILED:", error);
//     throw error;
//   }
// }

// // ======================================================
// // SUBSCRIBE TO ROOM
// // ======================================================

// export function subscribeToRoom(
//   roomCode,
//   callback,
//   onError
// ) {
//   requireDatabase();

//   const normalized = normalizeRoomCode(roomCode);
//   const roomPath = `rooms/${normalized}`;

//   return onValue(
//     ref(db, roomPath),

//     (snapshot) => {
//       callback(snapshot.val());
//     },

//     (error) => {
//       console.error(
//         "ROOM SUBSCRIPTION FAILED:",
//         error
//       );

//       if (onError) {
//         onError(error);
//       }
//     }
//   );
// }

// // ======================================================
// // MARK PLAYER AS DROPPED
// // ======================================================

// export async function dropPlayer(roomCode, playerId) {
//   requireDatabase();

//   const normalized = normalizeRoomCode(roomCode);

//   if (!playerId) {
//     throw new Error("Player ID is missing.");
//   }

//   const playerRef = ref(
//     db,
//     `rooms/${normalized}/players/${playerId}`
//   );

//   const result = await runTransaction(
//     playerRef,
//     (player) => {
//       if (!player || player.status === "dropped") {
//         return;
//       }

//       return {
//         ...player,
//         status: "dropped",
//         dropped: true,
//         droppedAt: Date.now(),
//         ticketGenerated: false,
//         ticketCount: 0,
//         tickets: null,
//       };
//     }
//   );

//   if (!result.committed) {
//     const current = result.snapshot.val();

//     if (!current) {
//       throw new Error(
//         "Player record was not found."
//       );
//     }
//   }

//   return result.snapshot.val();
// }

// // ======================================================
// // CLOSE ROOM
// // ======================================================

// export async function closeRoom(roomCode) {
//   requireDatabase();

//   try {
//     const normalized = normalizeRoomCode(roomCode);

//     await update(
//       ref(db, `rooms/${normalized}`),
//       {
//         roomActive: false,
//         closedAt: Date.now(),
//       }
//     );

//     console.log("ROOM CLOSED SUCCESSFULLY.");
//   } catch (error) {
//     console.error("CLOSE ROOM FAILED:", error);
//     throw error;
//   }
// }

// // ======================================================
// // PUBLISH NEXT NUMBER
// // ======================================================

// export async function publishNextNumber(roomCode) {
//   requireDatabase();

//   try {
//     const normalized = normalizeRoomCode(roomCode);
//     const roomRef = ref(db, `rooms/${normalized}`);

//     const result = await runTransaction(
//       roomRef,
//       (room) => {
//         if (
//           !room ||
//           room.roomActive !== true ||
//           room.gameCompleted === true
//         ) {
//           return;
//         }

//         const generated = Array.isArray(
//           room.generatedNumbers
//         )
//           ? room.generatedNumbers
//           : [];

//         if (generated.length >= 90) {
//           return;
//         }

//         if (room.gameStarted !== true) {
//           const players =
//             room.players &&
//             typeof room.players === "object"
//               ? Object.values(room.players)
//               : [];

//           const activePlayers = players.filter(
//             (player) =>
//               player &&
//               player.status !== "dropped" &&
//               player.dropped !== true &&
//               !player.droppedAt
//           );

//           if (activePlayers.length < 2) {
//             return;
//           }

//           const pendingPlayers = activePlayers.filter(
//             (player) =>
//               player.ticketGenerated !== true
//           );

//           if (pendingPlayers.length > 0) {
//             return;
//           }
//         }

//         const remainingNumbers = Array.from(
//           { length: 90 },
//           (_, index) => index + 1
//         ).filter(
//           (number) => !generated.includes(number)
//         );

//         if (remainingNumbers.length === 0) {
//           return;
//         }

//         const selectedNumber =
//           remainingNumbers[
//             Math.floor(
//               Math.random() * remainingNumbers.length
//             )
//           ];

//         const nextGenerated = [
//           ...generated,
//           selectedNumber,
//         ];

//         const currentClaims =
//           room.claims && typeof room.claims === "object"
//             ? room.claims
//             : {};

//         const updatedClaims = collectQualifiedWinners(
//           room,
//           currentClaims,
//           nextGenerated
//         );

//         const gameCompleted =
//           areAllPrizesClaimed(updatedClaims);

//         return {
//           ...room,
//           gameStarted: true,
//           gameStartedAt: room.gameStartedAt || Date.now(),
//           generatedNumbers: nextGenerated,
//           currentNumber: selectedNumber,
//           claims: updatedClaims,
//           gameCompleted,
//           gameCompletedAt: gameCompleted
//             ? room.gameCompletedAt || Date.now()
//             : null,
//         };
//       }
//     );

//     if (!result.committed) {
//       const currentRoom = result.snapshot.val();

//       if (!currentRoom) {
//         throw new Error("Room not found.");
//       }

//       if (currentRoom.gameCompleted === true) {
//         throw new Error(
//           "Game completed! All prizes have been claimed."
//         );
//       }

//       if (currentRoom.roomActive !== true) {
//         throw new Error("This room is closed.");
//       }

//       if (currentRoom.gameStarted !== true) {
//         const players =
//           currentRoom.players &&
//           typeof currentRoom.players === "object"
//             ? Object.values(currentRoom.players)
//             : [];

//         const activePlayers = players.filter(
//           (player) =>
//             player &&
//             player.status !== "dropped" &&
//             player.dropped !== true &&
//             !player.droppedAt
//         );

//         if (activePlayers.length < 2) {
//           throw new Error(
//             "At least 2 active players are required to start the game."
//           );
//         }

//         const pendingPlayers = activePlayers.filter(
//           (player) =>
//             player.ticketGenerated !== true
//         );

//         if (pendingPlayers.length > 0) {
//           const pendingNames = pendingPlayers
//             .map(
//               (player) =>
//                 player.name || "Unknown Player"
//             )
//             .join(", ");

//           throw new Error(
//             `Waiting for these active players to generate tickets: ${pendingNames}`
//           );
//         }
//       }

//       return null;
//     }

//     const selectedNumber =
//       result.snapshot.val().currentNumber;

//     console.log(
//       "NUMBER PUBLISHED:",
//       selectedNumber
//     );

//     return selectedNumber;
//   } catch (error) {
//     console.error(
//       "PUBLISH NUMBER FAILED:",
//       error
//     );
//     throw error;
//   }
// }

// // ======================================================
// // RESET ROOM NUMBERS
// // ======================================================

// export async function resetRoomNumbers(roomCode) {
//   requireDatabase();

//   try {
//     const normalized = normalizeRoomCode(roomCode);

//     await update(
//       ref(db, `rooms/${normalized}`),
//       {
//         generatedNumbers: [],
//         currentNumber: null,
//         claims: {},
//         gameStarted: false,
//         gameStartedAt: null,
//         gameCompleted: false,
//         gameCompletedAt: null,
//       }
//     );

//     console.log(
//       "ROOM NUMBERS AND CLAIMS RESET SUCCESSFULLY."
//     );
//   } catch (error) {
//     console.error("RESET ROOM FAILED:", error);
//     throw error;
//   }
// }

// // ======================================================
// // NORMALIZE TICKET DATA
// // ======================================================

// function toIndexedArray(value) {
//   if (Array.isArray(value)) {
//     return value;
//   }

//   if (!value || typeof value !== "object") {
//     return [];
//   }

//   const keys = Object.keys(value);

//   if (
//     !keys.length ||
//     !keys.every((key) => /^\d+$/.test(key))
//   ) {
//     return [];
//   }

//   const maxIndex = Math.max(
//     ...keys.map(Number)
//   );

//   return Array.from(
//     { length: maxIndex + 1 },
//     (_, index) => value[index] ?? ""
//   );
// }

// function toValidNumber(value) {
//   if (
//     value === null ||
//     value === undefined ||
//     value === ""
//   ) {
//     return null;
//   }

//   const number = Number(value);

//   return Number.isInteger(number) &&
//     number >= 1 &&
//     number <= 90
//     ? number
//     : null;
// }

// function normalizeTicket(ticket) {
//   const rows = toIndexedArray(ticket);

//   if (rows.length !== 3) {
//     return null;
//   }

//   const normalizedRows = rows.map((row) => {
//     const cells = toIndexedArray(row);

//     if (cells.length !== 9) {
//       return null;
//     }

//     return cells.map(toValidNumber);
//   });

//   if (normalizedRows.some((row) => !row)) {
//     return null;
//   }

//   if (
//     normalizedRows.some(
//       (row) =>
//         row.filter(
//           (cell) => cell !== null
//         ).length !== 5
//     )
//   ) {
//     return null;
//   }

//   return normalizedRows;
// }

// // ======================================================
// // PRIZE QUALIFICATION
// // ======================================================

// function ticketQualifies(ticket, prize, called) {
//   if (prize.type === "jaldi5") {
//     const matched = ticket.flat().filter(
//       (number) =>
//         number !== null && called.has(number)
//     ).length;

//     return matched >= 5;
//   }

//   if (prize.type === "fullHouse") {
//     const numbers = ticket
//       .flat()
//       .filter((number) => number !== null);

//     return (
//       numbers.length === 15 &&
//       numbers.every((number) => called.has(number))
//     );
//   }

//   const row = ticket[prize.rowIndex] || [];

//   const rowNumbers = row.filter(
//     (number) => number !== null
//   );

//   return (
//     rowNumbers.length === 5 &&
//     rowNumbers.every((number) => called.has(number))
//   );
// }

// // ======================================================
// // AUTOMATIC MULTIPLE-WINNER DETECTION
// // ======================================================

// function collectQualifiedWinners(
//   room,
//   claims,
//   calledValues
// ) {
//   const called = new Set(
//     calledValues
//       .map(toValidNumber)
//       .filter((number) => number !== null)
//   );

//   const updated = { ...claims };

//   const players =
//     room.players && typeof room.players === "object"
//       ? Object.entries(room.players)
//       : [];

//   for (const [prizeKey, prize] of Object.entries(
//     PRIZE_DEFINITIONS
//   )) {
//     const existingWinners = getPrizeWinnerList(
//       updated[prizeKey]
//     );

//     // The prize is awarded on the first draw where one
//     // or more players qualify. Preserve all winners from
//     // that draw on subsequent draws.
//     if (existingWinners.length > 0) {
//       continue;
//     }

//     const drawWinners = [];

//     for (const [playerId, player] of players) {
//       if (
//         !player ||
//         player.status === "dropped" ||
//         player.dropped === true ||
//         player.droppedAt
//       ) {
//         continue;
//       }

//       const tickets = toIndexedArray(player.tickets)
//         .map(normalizeTicket)
//         .filter(Boolean);

//       tickets.forEach((ticket, ticketIndex) => {
//         if (
//           !ticketQualifies(ticket, prize, called)
//         ) {
//           return;
//         }

//         drawWinners.push({
//           prizeKey,
//           prizeName: prize.label,
//           playerId,
//           playerName:
//             player.name || player.playerName || "Player",
//           ticketIndex,
//           claimedAt: Date.now(),
//           status: "approved",
//           automatic: true,
//         });
//       });
//     }

//     if (drawWinners.length > 0) {
//       updated[prizeKey] = drawWinners;
//     }
//   }

//   return updated;
// }

// // ======================================================
// // CLAIM PRIZE
// // ======================================================

// export async function claimPrize(
//   roomCode,
//   playerId,
//   prizeKey
// ) {
//   requireDatabase();

//   const normalized = normalizeRoomCode(roomCode);
//   const prize = PRIZE_DEFINITIONS[prizeKey];

//   if (normalized.length !== ROOM_CODE_LENGTH) {
//     throw new Error(
//       "Room code must contain exactly 6 digits."
//     );
//   }

//   if (!playerId) {
//     throw new Error("Player ID is missing.");
//   }

//   if (!prize) {
//     throw new Error("Invalid prize selected.");
//   }

//   const roomRef = ref(db, `rooms/${normalized}`);
//   let failureMessage = "";

//   const result = await runTransaction(
//     roomRef,
//     (room) => {
//       failureMessage = "";

//       if (!room || room.roomActive !== true) {
//         failureMessage = "This room is unavailable.";
//         return;
//       }

//       const player =
//         room.players && room.players[playerId];

//       if (
//         !player ||
//         player.status === "dropped" ||
//         player.dropped === true ||
//         player.droppedAt
//       ) {
//         failureMessage =
//           "Your player session is not active in this room.";
//         return;
//       }

//       const tickets = toIndexedArray(player.tickets)
//         .map(normalizeTicket)
//         .filter(Boolean);

//       if (!tickets.length) {
//         failureMessage =
//           "No valid ticket was found for your player.";
//         return;
//       }

//       const calledValues = toIndexedArray(
//         room.generatedNumbers
//       )
//         .map(toValidNumber)
//         .filter((number) => number !== null);

//       const called = new Set(calledValues);

//       if (!called.size) {
//         failureMessage =
//           "No numbers have been called yet.";
//         return;
//       }

//       const winningTicketIndex = tickets.findIndex(
//         (ticket) => ticketQualifies(ticket, prize, called)
//       );

//       if (winningTicketIndex < 0) {
//         failureMessage =
//           `Your ticket does not qualify for ${prize.label} yet.`;
//         return;
//       }

//       const existingClaims =
//         room.claims && typeof room.claims === "object"
//           ? room.claims
//           : {};

//       // First collect every player who qualified on
//       // the current draw, not only the person clicking.
//       const updatedClaims = collectQualifiedWinners(
//         room,
//         existingClaims,
//         calledValues
//       );

//       const winners = getPrizeWinnerList(
//         updatedClaims[prizeKey]
//       );

//       const alreadyRecorded = winners.some(
//         (winner) =>
//           winner.playerId === playerId &&
//           winner.ticketIndex === winningTicketIndex
//       );

//       // If automatic detection has not recorded this
//       // player yet, add their valid claim.
//       if (!alreadyRecorded) {
//         updatedClaims[prizeKey] = [
//           ...winners,
//           {
//             prizeKey,
//             prizeName: prize.label,
//             playerId,
//             playerName:
//               player.name || player.playerName || "Player",
//             ticketIndex: winningTicketIndex,
//             claimedAt: Date.now(),
//             status: "approved",
//           },
//         ];
//       }

//       const gameCompleted =
//         areAllPrizesClaimed(updatedClaims);

//       return {
//         ...room,
//         claims: updatedClaims,
//         gameCompleted,
//         gameCompletedAt: gameCompleted
//           ? room.gameCompletedAt || Date.now()
//           : null,
//       };
//     }
//   );

//   if (!result.committed) {
//     throw new Error(
//       failureMessage ||
//       "The claim could not be submitted. Please try again."
//     );
//   }

//   const updatedRoom = result.snapshot.val();

//   const winners = getPrizeWinnerList(
//     updatedRoom.claims?.[prizeKey]
//   );

//   return {
//     ...(winners.find(
//       (winner) => winner.playerId === playerId
//     ) || winners[winners.length - 1]),
//     winners,
//     gameCompleted: updatedRoom.gameCompleted === true,
//   };
// }

import {
  ref,
  get,
  set,
  update,
  onValue,
  runTransaction,
} from "firebase/database";

import { db } from "../firebase";

// ======================================================
// FIREBASE DATABASE CHECK
// ======================================================

function requireDatabase() {
  console.log("========== FIREBASE DATABASE CHECK ==========");

  if (!db) {
    console.error("Firebase database is NULL.");
    throw new Error(
      "Firebase is not configured. Check your .env file."
    );
  }

  console.log("Firebase initialized successfully.");
  console.log("Database URL:", db.app.options.databaseURL);
  console.log("Project ID:", db.app.options.projectId);
  console.log("=============================================");
}

// ======================================================
// CONSTANTS
// ======================================================

const ROOM_CODE_LENGTH = 6;
const ROOM_CODE_CHARS = "0123456789";

const PRIZE_DEFINITIONS = {
  jaldi5: { label: "Jaldi 5", type: "jaldi5" },
  firstLine: { label: "First Line", type: "row", rowIndex: 0 },
  secondLine: { label: "Second Line", type: "row", rowIndex: 1 },
  lastLine: { label: "Last Line", type: "row", rowIndex: 2 },
  fullHouse: { label: "Full House", type: "fullHouse" },
};

const REQUIRED_PRIZES = Object.keys(PRIZE_DEFINITIONS);

// ======================================================
// NORMALIZE ROOM CODE
// ======================================================

export function normalizeRoomCode(value = "") {
  return String(value)
    .replace(/\D/g, "")
    .slice(0, ROOM_CODE_LENGTH);
}

// ======================================================
// GENERATE ROOM CODE
// ======================================================

function makeRoomCode() {
  const bytes = new Uint8Array(ROOM_CODE_LENGTH);

  crypto.getRandomValues(bytes);

  return Array.from(
    bytes,
    (byte) => ROOM_CODE_CHARS[byte % 10]
  ).join("");
}

// ======================================================
// CHECK GAME COMPLETION
// ======================================================

function getPrizeWinnerList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);

  // Backward compatibility with rooms created before multiple-winner support.
  return value && typeof value === "object" ? [value] : [];
}

function areAllPrizesClaimed(claims = {}) {
  return REQUIRED_PRIZES.every(
    (prizeKey) => getPrizeWinnerList(claims[prizeKey]).length > 0
  );
}

// ======================================================
// CREATE ROOM
// ======================================================

export async function createRoom() {
  console.log("\n========== CREATE ROOM STARTED ==========");

  requireDatabase();

  try {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const roomCode = makeRoomCode();

      console.log("Attempt:", attempt + 1);
      console.log("Generated Room Code:", roomCode);

      const roomRef = ref(db, `rooms/${roomCode}`);

      const result = await runTransaction(
        roomRef,
        (currentRoom) => {
          if (currentRoom !== null) {
            return;
          }

          return {
            roomCode,
            roomActive: true,
            roomStatus: "waiting",
            gameStarted: false,
            gameCompleted: false,
            gameEnded: false,
            createdAt: Date.now(),
            generatedNumbers: [],
            currentNumber: null,
            players: {},
            claims: {},
          };
        }
      );

      if (result.committed) {
        console.log("ROOM CREATED SUCCESSFULLY:", roomCode);

        return {
          success: true,
          roomCode,
          data: result.snapshot.val(),
        };
      }
    }

    throw new Error(
      "Could not generate a unique room code. Please try again."
    );

  } catch (error) {
    console.error("CREATE ROOM FAILED:", error);
    throw error;
  }
}

// ======================================================
// GET ACTIVE ROOM
// ======================================================

export async function getActiveRoom(roomCode) {
  requireDatabase();

  try {
    const normalized = normalizeRoomCode(roomCode);

    if (normalized.length !== ROOM_CODE_LENGTH) {
      throw new Error(
        "Room code must contain exactly 6 digits."
      );
    }

    const roomRef = ref(db, `rooms/${normalized}`);
    const snapshot = await get(roomRef);

    const room = snapshot.val();

    if (!room) {
      throw new Error(
        "Room code not found. Check the code and try again."
      );
    }

    if (room.roomActive !== true) {
      throw new Error(
        "This room is closed and cannot be joined."
      );
    }

    return room;

  } catch (error) {
    console.error("GET ACTIVE ROOM FAILED:", error);
    throw error;
  }
}

// ======================================================
// JOIN ROOM
// ======================================================

export async function joinRoom(roomCode, playerName, playerId) {
  requireDatabase();

  try {
    const normalized = normalizeRoomCode(roomCode);
    const name = String(playerName || "").trim();

    if (normalized.length !== ROOM_CODE_LENGTH) {
      throw new Error(
        "Room code must contain exactly 6 digits."
      );
    }

    if (!name) {
      throw new Error(
        "Enter your name before joining."
      );
    }

    if (!playerId) {
      throw new Error(
        "Player ID is missing. Please try again."
      );
    }

    const roomRef = ref(db, `rooms/${normalized}`);

    const roomSnapshot = await get(roomRef);

    if (!roomSnapshot.exists()) {
      throw new Error("Room code not found.");
    }

    const room = roomSnapshot.val();

    if (room.roomActive !== true) {
      throw new Error("This room is closed.");
    }

    if (
      room.gameStarted === true ||
      room.gameCompleted === true
    ) {
      throw new Error(
        "The game has already started. New joins are closed."
      );
    }

    const players = room.players || {};

    if (players[playerId]) {
      throw new Error(
        "You have already joined this room."
      );
    }

    const playerRef = ref(
      db,
      `rooms/${normalized}/players/${playerId}`
    );

    await set(playerRef, {
      name,
      joinedAt: Date.now(),
      ticketGenerated: false,
      ticketCount: 0,
      status: "active",
      dropped: false,
    });

    console.log(
      "PLAYER JOINED SUCCESSFULLY:",
      playerId
    );

    const updatedSnapshot = await get(roomRef);

    return {
      roomCode: normalized,
      room: updatedSnapshot.val(),
    };

  } catch (error) {
    console.error("JOIN ROOM FAILED:", error);
    throw error;
  }
}

// ======================================================
// SUBSCRIBE TO ROOM
// ======================================================

export function subscribeToRoom(
  roomCode,
  callback,
  onError
) {
  requireDatabase();

  const normalized = normalizeRoomCode(roomCode);
  const roomPath = `rooms/${normalized}`;

  return onValue(
    ref(db, roomPath),

    (snapshot) => {
      callback(snapshot.val());
    },

    (error) => {
      console.error(
        "ROOM SUBSCRIPTION FAILED:",
        error
      );

      if (onError) {
        onError(error);
      }
    }
  );
}

// ======================================================
// MARK PLAYER AS DROPPED
// ======================================================

export async function dropPlayer(roomCode, playerId) {
  requireDatabase();

  const normalized = normalizeRoomCode(roomCode);

  if (!playerId) {
    throw new Error("Player ID is missing.");
  }

  const playerRef = ref(
    db,
    `rooms/${normalized}/players/${playerId}`
  );

  const result = await runTransaction(
    playerRef,
    (player) => {
      if (!player || player.status === "dropped") {
        return;
      }

      return {
        ...player,
        status: "dropped",
        dropped: true,
        droppedAt: Date.now(),
        ticketGenerated: false,
        ticketCount: 0,
        tickets: null,
      };
    }
  );

  if (!result.committed) {
    const current = result.snapshot.val();

    if (!current) {
      throw new Error(
        "Player record was not found."
      );
    }
  }

  return result.snapshot.val();
}

// ======================================================
// END GAME
// ======================================================

export async function endRoomGame(roomCode) {
  requireDatabase();

  const normalized = normalizeRoomCode(roomCode);

  if (normalized.length !== ROOM_CODE_LENGTH) {
    throw new Error("Room code must contain exactly 6 digits.");
  }

  const roomRef = ref(db, `rooms/${normalized}`);

  const result = await runTransaction(
    roomRef,
    (room) => {
      if (
        !room ||
        room.roomActive !== true ||
        room.roomStatus === "completed"
      ) {
        return;
      }

      const players =
        room.players && typeof room.players === "object"
          ? { ...room.players }
          : {};

      // Preserve tickets for final results/history.
      // Mark all tickets inactive.
      Object.keys(players).forEach((playerId) => {
        if (!players[playerId]) return;

        players[playerId] = {
          ...players[playerId],
          ticketActive: false,
        };
      });

      return {
        ...room,
        players,
        roomActive: false,
        roomStatus: "completed",
        gameEnded: true,
        endedAt: Date.now(),
      };
    }
  );

  if (!result.committed) {
    const room = result.snapshot.val();

    if (!room) {
      throw new Error("Room not found.");
    }

    if (
      room.roomStatus === "completed" ||
      room.gameEnded === true
    ) {
      return room;
    }

    throw new Error(
      "Unable to end this game. Please try again."
    );
  }

  return result.snapshot.val();
}

// Backward-compatible alias for older components.
export async function closeRoom(roomCode) {
  return endRoomGame(roomCode);
}
// ======================================================
// PUBLISH NEXT NUMBER
// ======================================================

export async function publishNextNumber(roomCode) {
  requireDatabase();

  try {
    const normalized = normalizeRoomCode(roomCode);
    const roomRef = ref(db, `rooms/${normalized}`);

    const result = await runTransaction(
      roomRef,
      (room) => {
        if (
          !room ||
          room.roomActive !== true ||
          room.gameCompleted === true
        ) {
          return;
        }

        const generated = Array.isArray(
          room.generatedNumbers
        )
          ? room.generatedNumbers
          : [];

        if (generated.length >= 90) {
          return;
        }

        // Before starting, require at least two active players
        // and ensure every active player has generated tickets.
        if (room.gameStarted !== true) {
          const players =
            room.players &&
            typeof room.players === "object"
              ? Object.values(room.players)
              : [];

          const activePlayers = players.filter(
            (player) =>
              player &&
              player.status !== "dropped" &&
              player.dropped !== true &&
              !player.droppedAt
          );

          if (activePlayers.length < 2) {
            return;
          }

          const pendingPlayers = activePlayers.filter(
            (player) =>
              player.ticketGenerated !== true
          );

          if (pendingPlayers.length > 0) {
            return;
          }
        }

        const remainingNumbers = Array.from(
          { length: 90 },
          (_, index) => index + 1
        ).filter(
          (number) => !generated.includes(number)
        );

        if (remainingNumbers.length === 0) {
          return;
        }

        const selectedNumber =
          remainingNumbers[
            Math.floor(
              Math.random() * remainingNumbers.length
            )
          ];

        const nextGenerated = [
          ...generated,
          selectedNumber,
        ];

        const currentClaims =
          room.claims &&
          typeof room.claims === "object"
            ? room.claims
            : {};

        const updatedClaims = collectQualifiedWinners(
          room,
          currentClaims,
          nextGenerated
        );

        const gameCompleted =
          areAllPrizesClaimed(updatedClaims);

        return {
          ...room,
          roomStatus: "playing",
          gameStarted: true,
          gameStartedAt:
            room.gameStartedAt || Date.now(),
          generatedNumbers: nextGenerated,
          currentNumber: selectedNumber,
          claims: updatedClaims,
          gameCompleted,
          gameCompletedAt: gameCompleted
            ? room.gameCompletedAt || Date.now()
            : null,
        };
      }
    );

    if (!result.committed) {
      const currentRoom = result.snapshot.val();

      if (!currentRoom) {
        throw new Error("Room not found.");
      }

      if (currentRoom.gameCompleted === true) {
        throw new Error(
          "Game completed! All prizes have been claimed."
        );
      }

      if (currentRoom.roomActive !== true) {
        throw new Error("This room is closed.");
      }

      if (currentRoom.gameStarted !== true) {
        const players =
          currentRoom.players &&
          typeof currentRoom.players === "object"
            ? Object.values(currentRoom.players)
            : [];

        const activePlayers = players.filter(
          (player) =>
            player &&
            player.status !== "dropped" &&
            player.dropped !== true &&
            !player.droppedAt
        );

        if (activePlayers.length < 2) {
          throw new Error(
            "At least 2 active players are required to start the game."
          );
        }

        const pendingPlayers = activePlayers.filter(
          (player) =>
            player.ticketGenerated !== true
        );

        if (pendingPlayers.length > 0) {
          const pendingNames = pendingPlayers
            .map(
              (player) =>
                player.name || "Unknown Player"
            )
            .join(", ");

          throw new Error(
            `Waiting for these active players to generate tickets: ${pendingNames}`
          );
        }
      }

      return null;
    }

    const selectedNumber =
      result.snapshot.val().currentNumber;

    console.log(
      "NUMBER PUBLISHED:",
      selectedNumber
    );

    return selectedNumber;

  } catch (error) {
    console.error(
      "PUBLISH NUMBER FAILED:",
      error
    );

    throw error;
  }
}

// ======================================================
// RESET ROOM NUMBERS
// ======================================================

export async function resetRoomNumbers(roomCode) {
  requireDatabase();

  try {
    const normalized = normalizeRoomCode(roomCode);

    await update(
      ref(db, `rooms/${normalized}`),
      {
        generatedNumbers: [],
        currentNumber: null,
        claims: {},
        roomStatus: "waiting",
        gameStarted: false,
        gameStartedAt: null,
        gameCompleted: false,
        gameCompletedAt: null,
        gameEnded: false,
        endedAt: null,
        roundId: Date.now(),
      }
    );

    console.log(
      "ROOM NUMBERS AND CLAIMS RESET SUCCESSFULLY."
    );

  } catch (error) {
    console.error(
      "RESET ROOM FAILED:",
      error
    );

    throw error;
  }
}

// ======================================================
// NORMALIZE TICKET DATA
// ======================================================

function toIndexedArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  const keys = Object.keys(value);

  if (
    !keys.length ||
    !keys.every((key) => /^\d+$/.test(key))
  ) {
    return [];
  }

  const maxIndex = Math.max(
    ...keys.map(Number)
  );

  return Array.from(
    { length: maxIndex + 1 },
    (_, index) => value[index] ?? ""
  );
}

function toValidNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isInteger(number) &&
    number >= 1 &&
    number <= 90
    ? number
    : null;
}

function normalizeTicket(ticket) {
  const rows = toIndexedArray(ticket);

  if (rows.length !== 3) {
    return null;
  }

  const normalizedRows = rows.map((row) => {
    const cells = toIndexedArray(row);

    if (cells.length !== 9) {
      return null;
    }

    return cells.map(toValidNumber);
  });

  if (normalizedRows.some((row) => !row)) {
    return null;
  }

  if (
    normalizedRows.some(
      (row) =>
        row.filter(
          (cell) => cell !== null
        ).length !== 5
    )
  ) {
    return null;
  }

  return normalizedRows;
}
// ======================================================
// PRIZE QUALIFICATION / AUTOMATIC MULTI-WINNER DETECTION
// ======================================================

function ticketQualifies(ticket, prize, called) {
  if (prize.type === "jaldi5") {
    const matched = ticket.flat().filter(
      (number) =>
        number !== null && called.has(number)
    ).length;

    return matched >= 5;
  }

  if (prize.type === "fullHouse") {
    const numbers = ticket
      .flat()
      .filter((number) => number !== null);

    return (
      numbers.length === 15 &&
      numbers.every((number) => called.has(number))
    );
  }

  const row = ticket[prize.rowIndex] || [];

  const rowNumbers = row.filter(
    (number) => number !== null
  );

  return (
    rowNumbers.length === 5 &&
    rowNumbers.every((number) => called.has(number))
  );
}

function collectQualifiedWinners(
  room,
  claims,
  calledValues
) {
  const called = new Set(
    calledValues
      .map(toValidNumber)
      .filter((number) => number !== null)
  );

  const updated = { ...claims };

  const players =
    room.players &&
    typeof room.players === "object"
      ? Object.entries(room.players)
      : [];

  // Check every active player's tickets for each prize.
  // Multiple players qualifying on the same draw are all recorded.

  for (const [prizeKey, prize] of Object.entries(
    PRIZE_DEFINITIONS
  )) {
    const existingWinners = getPrizeWinnerList(
      updated[prizeKey]
    );

    // Preserve the original winner list after the prize
    // has been awarded.
    if (existingWinners.length > 0) {
      continue;
    }

    const drawWinners = [];

    for (const [playerId, player] of players) {
      if (
        !player ||
        player.status === "dropped" ||
        player.dropped === true ||
        player.droppedAt
      ) {
        continue;
      }

      const tickets = toIndexedArray(player.tickets)
        .map(normalizeTicket)
        .filter(Boolean);

      tickets.forEach((ticket, ticketIndex) => {
        if (!ticketQualifies(ticket, prize, called)) {
          return;
        }

        drawWinners.push({
          prizeKey,
          prizeName: prize.label,
          playerId,
          playerName:
            player.name ||
            player.playerName ||
            "Player",
          ticketIndex,
          claimedAt: Date.now(),
          status: "approved",
          automatic: true,
        });
      });
    }

    if (drawWinners.length > 0) {
      updated[prizeKey] = drawWinners;
    }
  }

  return updated;
}

// ======================================================
// CLAIM PRIZE
// ======================================================

export async function claimPrize(
  roomCode,
  playerId,
  prizeKey
) {
  requireDatabase();

  const normalized = normalizeRoomCode(roomCode);
  const prize = PRIZE_DEFINITIONS[prizeKey];

  if (normalized.length !== ROOM_CODE_LENGTH) {
    throw new Error(
      "Room code must contain exactly 6 digits."
    );
  }

  if (!playerId) {
    throw new Error("Player ID is missing.");
  }

  if (!prize) {
    throw new Error("Invalid prize selected.");
  }

  const roomRef = ref(db, `rooms/${normalized}`);

  let failureMessage = "";

  const result = await runTransaction(
    roomRef,
    (room) => {
      failureMessage = "";

      if (!room || room.roomActive !== true) {
        failureMessage = "This room is unavailable.";
        return;
      }

      const player =
        room.players && room.players[playerId];

      if (
        !player ||
        player.status === "dropped" ||
        player.dropped === true ||
        player.droppedAt
      ) {
        failureMessage =
          "Your player session is not active in this room.";

        return;
      }

      const tickets = toIndexedArray(player.tickets)
        .map(normalizeTicket)
        .filter(Boolean);

      if (!tickets.length) {
        failureMessage =
          "No valid ticket was found for your player.";

        return;
      }

      const calledValues = toIndexedArray(
        room.generatedNumbers
      )
        .map(toValidNumber)
        .filter((number) => number !== null);

      const called = new Set(calledValues);

      if (!called.size) {
        failureMessage =
          "No numbers have been called yet.";

        return;
      }

      const winningTicketIndex = tickets.findIndex(
        (ticket) =>
          ticketQualifies(ticket, prize, called)
      );

      if (winningTicketIndex < 0) {
        failureMessage =
          `Your ticket does not qualify for ${prize.label} yet.`;

        return;
      }

      const existingClaims =
        room.claims &&
        typeof room.claims === "object"
          ? room.claims
          : {};

      const winners = getPrizeWinnerList(
        existingClaims[prizeKey]
      );

      const alreadyRecorded = winners.some(
        (winner) =>
          winner.playerId === playerId &&
          winner.ticketIndex === winningTicketIndex
      );

      if (
        winners.length > 0 &&
        !alreadyRecorded
      ) {
        failureMessage =
          `${prize.label} has already been awarded.`;

        return;
      }

      const updatedWinners = alreadyRecorded
        ? winners
        : [
            ...winners,
            {
              prizeKey,
              prizeName: prize.label,
              playerId,
              playerName:
                player.name ||
                player.playerName ||
                "Player",
              ticketIndex: winningTicketIndex,
              claimedAt: Date.now(),
              status: "approved",
            },
          ];

      const updatedClaims = {
        ...existingClaims,
        [prizeKey]: updatedWinners,
      };

      const gameCompleted =
        areAllPrizesClaimed(updatedClaims);

      return {
        ...room,
        claims: updatedClaims,
        gameCompleted,
        gameCompletedAt: gameCompleted
          ? room.gameCompletedAt || Date.now()
          : null,
      };
    }
  );

  if (!result.committed) {
    throw new Error(
      failureMessage ||
        "The claim could not be submitted. Please try again."
    );
  }

  const updatedRoom = result.snapshot.val();

  const winners = getPrizeWinnerList(
    updatedRoom.claims?.[prizeKey]
  );

  return {
    ...(
      winners.find(
        (winner) => winner.playerId === playerId
      ) || winners[winners.length - 1]
    ),
    winners,
    gameCompleted: updatedRoom.gameCompleted === true,
  };
}