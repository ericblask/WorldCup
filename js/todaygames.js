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
// Notice we are fetching ref(db) to get the root, which gives us both nodes!
onValue(ref(db), (snapshot) => {
    const data = snapshot.val();
    const container = document.getElementById('schedule-container');
    
if (!data || !data.recentschedule) { 
        container.innerHTML = "<h3>Error: No recent schedule data found.</h3>";
        return;
    }

    const schedules = data.recentschedule;
    const results = data.results || {}; // Fallback to empty object if no results exist yet

    container.innerHTML = ''; 

    // 4. Capture the match ID (the key, e.g. 537327) and put it inside the match object
    const matchArray = Object.keys(schedules).map(key => {
        return {
            matchId: key, // Saving the key so we can look up the result
            ...schedules[key]
        };
    });

    // Sort chronologically
    matchArray.sort((a, b) => new Date(a.date) - new Date(b.date));

    // 5. Loop through sorted matches
    matchArray.forEach(match => {
        const datePart = match.date.split(' ')[0];
        const timePart = match.date.split(' ')[1] ? match.date.split(' ')[1].substring(0, 5) : 'TBD';

        // MERGE RESULTS: Look up the result using the matchId
        const matchResult = results[match.matchId] || {};
        const status = matchResult.status || 'Scheduled';
        
        // Determine the CSS class based on the status
        let statusClass = '';
        if (status === 'Finished') {
            statusClass = 'status-finished';
        } else if (status === 'In_Play' || status === 'Paused') {
            statusClass = 'status-live';
        }

        // Bonus: If you store scores as 'homeScore' and 'awayScore' in your results node,
        // this will display the score for live/finished games, and the time for future games!
        const scoreDisplay = (status === 'Finished' || status === 'In_Play' || status === 'Paused') 
            ? `<div class="score" style="font-size: 1.2em; font-weight: bold;">${matchResult.homeScore ?? '-'} : ${matchResult.awayScore ?? '-'}</div>` 
            : `<div class="time">${timePart}</div>`;

        // Inject the statusClass into the main row div
        container.innerHTML += `
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
});
