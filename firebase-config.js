// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, push, set, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Obfuscated configuration
const _0x5a8e=['713376875689','budisangster-default-rtdb.asia-southeast1.firebasedatabase.app','budisangster.firebaseapp.com','G-SB2SGWGSTJ','budisangster.firebasestorage.app','AIzaSyDvepAoLd2O9U22Ec_T6n3YncMdAt1whH0','budisangster','1:713376875689:web:31818e226826157b31d5b8'];
const _0x4f=['apiKey','authDomain','databaseURL','projectId','storageBucket','messagingSenderId','appId','measurementId'];

// Deobfuscate configuration
const getConfig = () => {
    const config = {};
    for(let i = 0; i < _0x4f.length; i++) {
        config[_0x4f[i]] = _0x5a8e[i];
    }
    return config;
};

// Initialize Firebase with deobfuscated config
const app = initializeApp(getConfig());
const database = getDatabase(app);

export { database, ref, onValue, push, set, remove }; 