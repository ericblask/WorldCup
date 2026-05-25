import { getFormattedDate, extractDateFromField } from "./dateUtils.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";

// 1. YOUR FIREBASE CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyCKV4Q_7dJ_fPk6WK4rQs8GiZRvCKhgpng",
    authDomain: "worldcup2026-5219e.firebaseapp.com",
    databaseURL: "https://worldcup2026-5219e-default-rtdb.firebaseio.com/",
    projectId: "worldcup2026-5219e",
    storageBucket: "worldcup2026-5219e.appspot.com",
    messagingSenderId: "1089995362453",
    appId: "1:1089995362453:web:976781ec8aaf63477c0b9c"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const d = new Date();
d.setDate(d.getDate() - 1); // Subtract one day
const target = getFormattedDate(d);

onValue(ref(db, 'schedules'), (snapshot) => {
    const matches = Object.values(snapshot.val() || {});
    const yesterdayMatches = matches.filter(m => extractDateFromField(m.date) === target);
    
    console.log("Yesterday's Matches:", yesterdayMatches);
    // Add logic here to render these to your DOM (e.g., container.innerHTML = ...)
});
