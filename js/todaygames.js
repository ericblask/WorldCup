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

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 2. DATE FILTER SETUP
// Helper function to format dates as YYYY-MM-DD to match Firebase data
function getFormattedDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Calculate Yesterday, Today, and Tomorrow based on the user's local timezone
const now = new Date();
const yesterday = new Date(now);
yesterday.setDate(now.getDate() - 1);
const tomorrow = new Date(now);
tomorrow.setDate(now.getDate() + 1);

// Store the valid date strings in an array for easy comparison
const validDates = [
    getFormattedDate(yesterday),
    getFormattedDate(now),
    getFormattedDate(tomorrow)
];

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

    container.innerHTML = ''; 

    // 4. Capture the match ID (the key) and put it inside the match object
    let matchArray = Object.keys(schedules).map(key => {
        return {
            matchId: key, 
            ...schedules[key]
        };
    });

    // 5. FILTER FOR YESTERDAY, TODAY, AND TOMORROW
    matchArray = matchArray.filter(match => {
        // Extract just the 'YYYY-MM-DD' part of the string
        const datePart = match.date.split(' ')[0]; 
        // Keep the match only if its date is in our validDates array
        return validDates.includes(datePart);
    });

    // Sort chronologically
    matchArray.sort((a, b) => new Date(a.date) - new Date(b.date));

    // 6. Loop through sorted and filtered matches
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
