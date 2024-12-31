// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, push, set, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDvepAoLd2O9U22Ec_T6n3YncMdAt1whH0",
    authDomain: "budisangster.firebaseapp.com",
    databaseURL: "https://budisangster-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "budisangster",
    storageBucket: "budisangster.firebasestorage.app",
    messagingSenderId: "713376875689",
    appId: "1:713376875689:web:31818e226826157b31d5b8",
    measurementId: "G-SB2SGWGSTJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database, ref, onValue, push, set, remove }; 