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
    const drafts = data.draft || {};        // Fetch drafts for family assignments

    // Helper function to find a family name by the country's string name
    const getFamilyByName = (teamName) => {
        for (const famKey in drafts) {
            const familyData = drafts[famKey];
            
            if (familyData && familyData.countries) {
                const draftedCountries = Object.values(familyData.countries);
                
                for (const country of draftedCountries) {
                    if (country.name === teamName) {
                        return familyData.name || ''; 
                    }
                }
            }
        }
        return ''; 
    };

    // 4. Capture the match ID
    const matchArray = Object.keys(schedules).map(key => {
        return {
            matchId: key, 
            ...schedules[key]
        };
    });

    // Sort chronologically
    matchArray.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Create an empty string to hold all the HTML we generate
    let htmlOutput = ''; 

    // 5. Loop through sorted matches
    matchArray.forEach(match => {
        // --- NEW: US Date and Time Formatting ---
        const matchDateString = match.date || '';
        let datePart = 'TBD';
        let timePart = 'TBD';

        const parsedDate = new Date(matchDateString);
        
        // Check if it's a valid date object
        if (!isNaN(parsedDate.getTime())) {
            // US Date format (e.g., "Jun 11, 2026")
            datePart = parsedDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
            
            // US 12-hour Time format (e.g., "3:00 PM")
            timePart = parsedDate.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        } else {
            // Fallback to original split if the date string is malformed
            const parts = matchDateString.split(' ');
            if (parts[0]) datePart = parts[0];
            if (parts[1]) timePart = parts[1].substring(0, 5);
        }
        // ----------------------------------------

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

        // Score display (showing formatted time for scheduled games)
        const scoreDisplay = (status === 'Finished' || status === 'In_Play' || status === 'Paused') 
            ? `<div class="score" style="font-size: 1.2em; font-weight: bold;">${matchResult.homeScore ?? '-'} : ${matchResult.awayScore ?? '-'}</div>` 
            : `<div class="time">${timePart}</div>`;

        // Safely grab the stage 
        const stageText = match.stage || '';

        // Grab family names using our helper function against the draft node
        const homeFamily = getFamilyByName(match.homeTeam);
        const awayFamily = getFamilyByName(match.awayTeam);

        // Append HTML structure for the match row
        htmlOutput += `
            <div class="match-row ${statusClass}">
                <div class="team-left">
                    <span class="team-name">${match.homeTeam}</span>
                    <img src="${match.homeFlag}" alt="${match.homeTeam}" class="team-flag">
                    <span class="family-name">${homeFamily}</span>
                </div>
                
                <div class="match-info">
                    <div class="stage">${stageText}</div>
                    <div class="date">${datePart}</div>
                    ${scoreDisplay}
                </div>

                <div class="team-right">
                    <span class="team-name">${match.awayTeam}</span>
                    <img src="${match.awayFlag}" alt="${match.awayTeam}" class="team-flag">
                    <span class="family-name">${awayFamily}</span>
                </div>
            </div>
        `;
    });

    // Inject the fully built HTML string into the container all at once
    container.innerHTML = htmlOutput;
});
