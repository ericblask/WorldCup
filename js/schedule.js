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
    appId: "1:1089995362453:web:6cb7fb7f6666bad07c0b9c"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 3. FETCH BOTH SCHEDULES AND RESULTS
onValue(ref(db), (snapshot) => {
    const data = snapshot.val();
    const container = document.getElementById('schedule-container');
    
    if (!data || !data.schedules) {
        container.innerHTML = "<h3>Error: No schedules data found.</h3>";
        return;
    }

    const schedules = data.schedules;
    const results = data.results || {}; 

    // 4. Capture the match ID
    const matchArray = Object.keys(schedules).map(key => {
        return {
            matchId: key, 
            ...schedules[key]
        };
    });

    // Sort chronologically
    matchArray.sort((a, b) => new Date(a.date) - new Date(b.date));

    // UPDATE: Create an empty string to hold all the HTML we generate
    let htmlOutput = ''; 

    // 5. Loop through sorted matches
    matchArray.forEach(match => {
        // UPDATE: Fallback added to prevent .split() from crashing if 'date' is missing
        const matchDate = match.date || 'TBD TBD';
        const datePart = matchDate.split(' ')[0];
        const timePart = matchDate.split(' ')[1] ? matchDate.split(' ')[1].substring(0, 5) : 'TBD';

        // MERGE RESULTS
        const matchResult = results[match.matchId] || {};
        const status = matchResult.status || 'Scheduled';
        
        // Determine the CSS class
        let statusClass = '';
        if (status === 'Finished') {
            statusClass = 'status-finished';
        } else if (status === 'In_Play' || status === 'Paused') {
            statusClass = 'status-live';
        }

        // Score display
        const scoreDisplay = (status === 'Finished' || status === 'In_Play' || status === 'Paused') 
            ? `<div class="score" style="font-size: 1.2em; font-weight: bold;">${matchResult.homeScore ?? '-'} : ${matchResult.awayScore ?? '-'}</div>` 
            : `<div class="time">${timePart}</div>`;

        // UPDATE: Append to our string variable instead of the DOM
        htmlOutput += `
            <div class="match-row ${statusClass}">
                <div class="team-left">
                    <span class="team-name">${match.homeTeam}</span>
                    <img src="${match.homeFlag}" alt="${match.homeTeam}" width="30">
                </div>
                
                <div class="match-info">
                    <div class="date">${datePart}</div>
                    ${scoreDisplay}
                </div>

                <div class="team-right">
                    <img src="${match.awayFlag}" alt="${match.awayTeam}" width="30">
                    <span class="team-name">${match.awayTeam}</span>
                </div>
            </div>
        `;
    });

    // UPDATE: Inject the fully built HTML string into the container all at once
    container.innerHTML = htmlOutput;
});
