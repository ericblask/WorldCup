import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

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

// 2. INITIALIZE FIREBASE
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 3. FETCH AND RENDER SCHEDULES
onValue(ref(db, 'schedules'), (snapshot) => {
    const schedules = snapshot.val();
    const container = document.getElementById('schedule-container');
    
    if (!schedules) {
        container.innerHTML = "<h3>Error: No data found at the 'schedules' path.</h3>";
        return;
    }

    // Clear the container
    container.innerHTML = ''; 

    // Convert the object of matches into an array and sort chronologically
    const matchArray = Object.values(schedules);
    matchArray.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Loop through sorted matches and render HTML
    matchArray.forEach(match => {
        // Extract date and time cleanly
        const datePart = match.date.split(' ')[0];
        // Safely grab the time, falling back to 'TBD' if missing
        const timePart = match.date.split(' ')[1] ? match.date.split(' ')[1].substring(0, 5) : 'TBD';

        container.innerHTML += `
            <div class="match-row">
                <div class="team-left">
                    <span class="team-name">${match.homeTeam}</span>
                    <img src="${match.homeFlag}" alt="${match.homeTeam}" width="30">
                </div>
                
                <div class="match-info">
                    <div class="date">${datePart}</div>
                    <div class="time">${timePart}</div>
                </div>

                <div class="team-right">
                    <img src="${match.awayFlag}" alt="${match.awayTeam}" width="30">
                    <span class="team-name">${match.awayTeam}</span>
                </div>
            </div>
        `;
    });
});
