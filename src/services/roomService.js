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
// // FIREBASE CONFIGURATION
// // ======================================================

// console.log("========== ROOM SERVICE INITIALIZED ==========");

// if (db) {
//   console.log("Firebase initialized successfully.");
//   console.log("Database URL:", db.app.options.databaseURL);
//   console.log("Project ID:", db.app.options.projectId);
// } else {
//   console.error("Firebase database is not initialized.");
// }

// console.log("================================================");

// // ======================================================
// // NORMALIZE ROOM CODE
// // ======================================================

// export const normalizeRoomCode = (roomCode) => {
//   return String(roomCode || "").trim();
// };

// // ======================================================
// // CREATE ROOM
// // ======================================================

// export const createRoom = async (roomCode) => {
//   try {
//     console.log("========== CREATE ROOM STARTED ==========");

//     const normalizedCode = normalizeRoomCode(roomCode);

//     console.log("Room Code:", normalizedCode);

//     if (!db) {
//       throw new Error("Firebase database is not initialized.");
//     }

//     if (!/^\d{6}$/.test(normalizedCode)) {
//       throw new Error("Invalid room code. Room code must be 6 digits.");
//     }

//     const roomRef = ref(db, `rooms/${normalizedCode}`);
//     const snapshot = await get(roomRef);

//     if (snapshot.exists()) {
//       throw new Error("Room code already exists.");
//     }

//     const roomData = {
//       roomCode: normalizedCode,
//       roomActive: true,
//       gameStarted: false,
//       createdAt: Date.now(),
//       generatedNumbers: [],
//       currentNumber: null,
//       players: {},
//     };

//     console.log("Creating room:", roomData);

//     await set(roomRef, roomData);

//     console.log("ROOM CREATED SUCCESSFULLY");

//     return {
//       success: true,
//       roomCode: normalizedCode,
//       data: roomData,
//     };
//   } catch (error) {
//     console.error("CREATE ROOM FAILED:", error);
//     throw error;
//   }
// };

// // ======================================================
// // GET ACTIVE ROOM
// // ======================================================

// export const getActiveRoom = async (roomCode) => {
//   try {
//     console.log("========== GET ACTIVE ROOM ==========");

//     const normalizedCode = normalizeRoomCode(roomCode);

//     console.log("Checking room:", normalizedCode);

//     if (!db) {
//       throw new Error("Firebase database is not initialized.");
//     }

//     const roomRef = ref(db, `rooms/${normalizedCode}`);
//     const snapshot = await get(roomRef);

//     console.log("Room Exists:", snapshot.exists());
//     console.log("Room Data:", snapshot.val());

//     if (!snapshot.exists()) {
//       return null;
//     }

//     const roomData = snapshot.val();

//     if (roomData.roomActive !== true) {
//       console.warn("Room is inactive.");
//       return null;
//     }

//     return roomData;
//   } catch (error) {
//     console.error("GET ACTIVE ROOM FAILED:", error);
//     throw error;
//   }
// };

// // ======================================================
// // JOIN ROOM
// // ======================================================

// export const joinRoom = async (roomCode, playerName, playerId) => {
//   try {
//     console.log("========== JOIN ROOM STARTED ==========");

//     const normalizedCode = normalizeRoomCode(roomCode);
//     const normalizedName = String(playerName || "").trim();

//     console.log("Entered Room Code:", roomCode);
//     console.log("Normalized Room Code:", normalizedCode);
//     console.log("Player Name:", normalizedName);
//     console.log("Player ID:", playerId);

//     if (!db) {
//       throw new Error("Firebase database is not initialized.");
//     }

//     if (!/^\d{6}$/.test(normalizedCode)) {
//       throw new Error("Please enter a valid 6-digit room code.");
//     }

//     if (!normalizedName) {
//       throw new Error("Please enter your name.");
//     }

//     if (!playerId) {
//       throw new Error("Player ID is missing.");
//     }

//     const roomPath = `rooms/${normalizedCode}`;
//     const roomRef = ref(db, roomPath);

//     console.log("Firebase Room Path:", roomPath);

//     // Fetch room
//     const roomSnapshot = await get(roomRef);

//     console.log("Room Exists:", roomSnapshot.exists());
//     console.log("Room Data:", roomSnapshot.val());

//     if (!roomSnapshot.exists()) {
//       throw new Error("Room code not found.");
//     }

//     const roomData = roomSnapshot.val();

//     // Validate room
//     if (roomData.roomActive !== true) {
//       throw new Error("This room has been closed.");
//     }

//     if (roomData.gameStarted === true) {
//       throw new Error("The game has already started.");
//     }

//     const existingPlayers = roomData.players || {};

//     // Check existing player
//     if (existingPlayers[playerId]) {
//       console.log("Player already joined.");

//       return {
//         success: true,
//         roomCode: normalizedCode,
//         playerId,
//         player: existingPlayers[playerId],
//         alreadyJoined: true,
//       };
//     }

//     // Add player
//     const playerData = {
//       name: normalizedName,
//       joinedAt: Date.now(),
//       ticketGenerated: false,
//       ticketCount: 0,
//     };

//     const playerPath = `rooms/${normalizedCode}/players/${playerId}`;

//     console.log("Adding player at:", playerPath);
//     console.log("Player Data:", playerData);

//     await set(ref(db, playerPath), playerData);

//     // Verify
//     const verifySnapshot = await get(ref(db, playerPath));

//     if (!verifySnapshot.exists()) {
//       throw new Error("Player could not be added to the room.");
//     }

//     console.log("PLAYER JOINED SUCCESSFULLY");
//     console.log("Verified Player:", verifySnapshot.val());

//     return {
//       success: true,
//       roomCode: normalizedCode,
//       playerId,
//       player: verifySnapshot.val(),
//       alreadyJoined: false,
//     };
//   } catch (error) {
//     console.error("========== JOIN ROOM FAILED ==========");
//     console.error("Error Code:", error.code);
//     console.error("Error Message:", error.message);
//     console.error("Full Error:", error);

//     throw error;
//   }
// };

// // ======================================================
// // SUBSCRIBE TO ROOM
// // ======================================================

// export const subscribeToRoom = (roomCode, callback) => {
//   const normalizedCode = normalizeRoomCode(roomCode);

//   console.log("========== ROOM SUBSCRIPTION ==========");
//   console.log("Subscribing to:", `rooms/${normalizedCode}`);

//   const roomRef = ref(db, `rooms/${normalizedCode}`);

//   return onValue(
//     roomRef,
//     (snapshot) => {
//       const roomData = snapshot.val();

//       console.log("ROOM DATA UPDATED:", roomData);

//       callback(roomData);
//     },
//     (error) => {
//       console.error("ROOM SUBSCRIPTION FAILED:", error);
//     }
//   );
// };

// // ======================================================
// // CLOSE ROOM
// // ======================================================

// export const closeRoom = async (roomCode) => {
//   try {
//     const normalizedCode = normalizeRoomCode(roomCode);

//     console.log("========== CLOSE ROOM ==========");
//     console.log("Room Code:", normalizedCode);

//     await update(ref(db, `rooms/${normalizedCode}`), {
//       roomActive: false,
//     });

//     console.log("ROOM CLOSED SUCCESSFULLY");
//   } catch (error) {
//     console.error("CLOSE ROOM FAILED:", error);
//     throw error;
//   }
// };

// // ======================================================
// // PUBLISH NEXT NUMBER
// // ======================================================

// export const publishNextNumber = async (roomCode, requestedNumber = null) => {
//   try {
//     console.log("========== PUBLISH NEXT NUMBER STARTED ==========");

//     const normalizedCode = normalizeRoomCode(roomCode);

//     console.log("Room Code:", normalizedCode);
//     console.log("Requested Number:", requestedNumber);

//     if (!db) {
//       throw new Error("Firebase database is not initialized.");
//     }

//     if (!normalizedCode) {
//       throw new Error("Room code is missing.");
//     }

//     const roomRef = ref(db, `rooms/${normalizedCode}`);

//     console.log("Starting Firebase transaction...");

//     const result = await runTransaction(roomRef, (roomData) => {
//       console.log("TRANSACTION CALLBACK EXECUTED");
//       console.log("Current Room Data:", roomData);

//       if (!roomData) {
//         console.error("Room does not exist.");
//         return;
//       }

//       if (roomData.roomActive !== true) {
//         console.error("Room is inactive.");
//         return;
//       }

//       if (roomData.gameStarted === false) {
//         // The game may start with the first published number.
//         console.log("Game is not started yet. Checking tickets...");
//       }

//       const players = roomData.players || {};
//       const playerList = Object.values(players);

//       if (playerList.length === 0) {
//         console.error("No players have joined.");
//         return;
//       }

//       const allTicketsGenerated = playerList.every(
//         (player) =>
//           player &&
//           (
//             player.ticketGenerated === true ||
//             (Array.isArray(player.tickets) && player.tickets.length > 0)
//           )
//       );

//       if (!allTicketsGenerated) {
//         console.error("Not all players have generated tickets.");
//         return;
//       }

//       const generatedNumbers = Array.isArray(roomData.generatedNumbers)
//         ? roomData.generatedNumbers.map(Number)
//         : [];

//       console.log("Already Generated Numbers:", generatedNumbers);

//       let nextNumber;

//       // If a number is explicitly provided, validate it.
//       if (requestedNumber !== null && requestedNumber !== undefined) {
//         nextNumber = Number(requestedNumber);

//         if (
//           !Number.isInteger(nextNumber) ||
//           nextNumber < 1 ||
//           nextNumber > 90
//         ) {
//           console.error("Invalid requested number:", requestedNumber);
//           return;
//         }

//         if (generatedNumbers.includes(nextNumber)) {
//           console.error("Number already generated:", nextNumber);
//           return;
//         }
//       } else {
//         // Automatically select a remaining number.
//         const remainingNumbers = Array.from(
//           { length: 90 },
//           (_, index) => index + 1
//         ).filter((number) => !generatedNumbers.includes(number));

//         console.log("Remaining Numbers:", remainingNumbers.length);

//         if (remainingNumbers.length === 0) {
//           console.error("All 90 numbers have been generated.");
//           return;
//         }

//         const randomIndex = Math.floor(
//           Math.random() * remainingNumbers.length
//         );

//         nextNumber = remainingNumbers[randomIndex];
//       }

//       console.log("Selected Tambola Number:", nextNumber);

//       return {
//         ...roomData,
//         gameStarted: true,
//         currentNumber: nextNumber,
//         generatedNumbers: [...generatedNumbers, nextNumber],
//       };
//     });

//     console.log("Transaction Committed:", result.committed);
//     console.log("Final Transaction Data:", result.snapshot.val());

//     if (!result.committed) {
//       const latestData = result.snapshot.val();

//       if (!latestData) {
//         throw new Error("Room not found.");
//       }

//       if (latestData.roomActive !== true) {
//         throw new Error("Room is inactive.");
//       }

//       if (Object.keys(latestData.players || {}).length === 0) {
//         throw new Error("No players have joined this room.");
//       }

//       const allTicketsGenerated = Object.values(
//         latestData.players || {}
//       ).every(
//         (player) =>
//           player &&
//           (
//             player.ticketGenerated === true ||
//             (Array.isArray(player.tickets) && player.tickets.length > 0)
//           )
//       );

//       if (!allTicketsGenerated) {
//         throw new Error("Waiting for all players to generate their tickets.");
//       }

//       if ((latestData.generatedNumbers || []).length >= 90) {
//         throw new Error("All 90 Tambola numbers have been generated.");
//       }

//       throw new Error("Unable to publish the next number. Please try again.");
//     }

//     const publishedNumber = result.snapshot.val().currentNumber;

//     console.log("NUMBER PUBLISHED SUCCESSFULLY:", publishedNumber);
//     console.log("========== PUBLISH NEXT NUMBER COMPLETED ==========");

//     return publishedNumber;
//   } catch (error) {
//     console.error("========== PUBLISH NUMBER FAILED ==========");
//     console.error("Error Code:", error.code);
//     console.error("Error Message:", error.message);
//     console.error("Full Error:", error);

//     throw error;
//   }
// };

// // ======================================================
// // RESET ROOM NUMBERS
// // ======================================================

// export const resetRoomNumbers = async (roomCode) => {
//   try {
//     const normalizedCode = normalizeRoomCode(roomCode);

//     console.log("========== RESET ROOM NUMBERS ==========");
//     console.log("Room Code:", normalizedCode);

//     const roomRef = ref(db, `rooms/${normalizedCode}`);

//     await update(roomRef, {
//       generatedNumbers: [],
//       currentNumber: null,
//       gameStarted: false,
//     });

//     console.log("ROOM NUMBERS RESET SUCCESSFULLY");

//     return true;
//   } catch (error) {
//     console.error("RESET ROOM FAILED:", error);
//     throw error;
//   }
// };


import {
  ref,
  get,
  set,
  update,
  onValue,
  push,
  remove,
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

// =====================================================
// CREATE ROOM
// =====================================================

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
          // Do not overwrite an existing room.
          if (currentRoom !== null) {
            return;
          }

          return {
            roomCode,
            roomActive: true,
            gameStarted: false,
            createdAt: Date.now(),
            generatedNumbers: [],
            currentNumber: null,
            players: {},
          };
        }
      );

      console.log("Transaction Committed:", result.committed);

      if (result.committed) {
        console.log("ROOM CREATED SUCCESSFULLY:", roomCode);

        return {
          success: true,
          roomCode: roomCode,
          data: result.snapshot.val(),
        };
      }
    }

    throw new Error(
      "Could not generate a unique room code. Please try again."
    );

  } catch (error) {
    console.error("CREATE ROOM FAILED:", error);
    console.error("Error Code:", error.code);
    console.error("Error Message:", error.message);

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
      throw new Error("Room code must contain exactly 6 digits.");
    }

    if (!name) {
      throw new Error("Enter your name before joining.");
    }

    if (!playerId) {
      throw new Error("Player ID is missing. Please try again.");
    }

    const roomRef = ref(db, `rooms/${normalized}`);

    // 1. Read room
    const roomSnapshot = await get(roomRef);

    if (!roomSnapshot.exists()) {
      throw new Error("Room code not found.");
    }

    const room = roomSnapshot.val();

    console.log("ROOM FOUND:", room);

    // 2. Validate room
    if (room.roomActive !== true) {
      throw new Error("This room is closed.");
    }

    if (room.gameStarted === true) {
      throw new Error("The game has already started.");
    }

    const players = room.players || {};

    if (players[playerId]) {
      throw new Error("You have already joined this room.");
    }

    // 3. Add player
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

    console.log("PLAYER JOINED SUCCESSFULLY:", playerId);

    // 4. Read updated room
    const updatedSnapshot = await get(roomRef);

    return {
      roomCode: normalized,
      room: updatedSnapshot.val(),
    };

  } catch (error) {
    console.error("JOIN ROOM FAILED:", error);
    console.error("ERROR CODE:", error.code);
    console.error("ERROR MESSAGE:", error.message);

    throw error;
  }
}
// ======================================================
// SUBSCRIBE TO ROOM
// ======================================================

export function subscribeToRoom(roomCode, callback, onError) {
  requireDatabase();

  const normalized = normalizeRoomCode(roomCode);
  const roomPath = `rooms/${normalized}`;

  return onValue(
    ref(db, roomPath),

    (snapshot) => {
      callback(snapshot.val());
    },

    (error) => {
      console.error("ROOM SUBSCRIPTION FAILED:", error);

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
      throw new Error("Player record was not found.");
    }
  }

  return result.snapshot.val();
}

// ======================================================
// CLOSE ROOM
// ======================================================

export async function closeRoom(roomCode) {
  requireDatabase();

  try {
    const normalized = normalizeRoomCode(roomCode);

    await update(ref(db, `rooms/${normalized}`), {
      roomActive: false,
      closedAt: Date.now(),
    });

    console.log("ROOM CLOSED SUCCESSFULLY.");

  } catch (error) {
    console.error("CLOSE ROOM FAILED:", error);
    throw error;
  }
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
        if (!room || room.roomActive !== true) {
          return;
        }

        const generated = Array.isArray(room.generatedNumbers)
          ? room.generatedNumbers
          : [];

        if (generated.length >= 90) {
          return;
        }

        // Only validate players before the game starts.
        if (room.gameStarted !== true) {
          const players =
            room.players && typeof room.players === "object"
              ? Object.values(room.players)
              : [];

          const activePlayers = players.filter(
            (player) =>
              player &&
              player.status !== "dropped" &&
              player.dropped !== true &&
              !player.droppedAt
          );

          // Minimum 2 active players required.
          if (activePlayers.length < 2) {
            return;
          }

          // Every active player must generate a ticket.
          const pendingPlayers = activePlayers.filter(
            (player) => player.ticketGenerated !== true
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
            Math.floor(Math.random() * remainingNumbers.length)
          ];

        return {
          ...room,

          gameStarted: true,
          gameStartedAt: room.gameStartedAt || Date.now(),

          generatedNumbers: [
            ...generated,
            selectedNumber,
          ],

          currentNumber: selectedNumber,
        };
      }
    );

    if (!result.committed) {
      const currentRoom = result.snapshot.val();

      if (!currentRoom) {
        throw new Error("Room not found.");
      }

      if (currentRoom.roomActive !== true) {
        throw new Error("This room is closed.");
      }

      if (currentRoom.gameStarted !== true) {
        const players =
          currentRoom.players && typeof currentRoom.players === "object"
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
          (player) => player.ticketGenerated !== true
        );

        if (pendingPlayers.length > 0) {
          const pendingNames = pendingPlayers
            .map((player) => player.name || "Unknown Player")
            .join(", ");

          throw new Error(
            `Waiting for these active players to generate tickets: ${pendingNames}`
          );
        }
      }

      return null;
    }

    const selectedNumber = result.snapshot.val().currentNumber;

    console.log("NUMBER PUBLISHED:", selectedNumber);

    return selectedNumber;

  } catch (error) {
    console.error("PUBLISH NUMBER FAILED:", error);
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

    await update(ref(db, `rooms/${normalized}`), {
      generatedNumbers: [],
      currentNumber: null,
    });

    console.log("ROOM NUMBERS RESET SUCCESSFULLY.");

  } catch (error) {
    console.error("RESET ROOM FAILED:", error);
    throw error;
  }
}