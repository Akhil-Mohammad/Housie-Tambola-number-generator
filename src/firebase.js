import { initializeApp } from "firebase/app";

import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBVCC5wC_1bNFXmBAcfqTV5X9r097FZFnU",

  authDomain:
    "housieonline-f0399.firebaseapp.com",

  databaseURL:
    "https://housieonline-f0399-default-rtdb.asia-southeast1.firebasedatabase.app",

  projectId: "housieonline-f0399",

  storageBucket:
    "housieonline-f0399.firebasestorage.app",

  messagingSenderId:
    "176261375285",

  appId:
    "1:176261375285:web:78d08a9f3a6970e05dd87c",
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);