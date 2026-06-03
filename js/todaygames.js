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
    
    if (!data || !data.recentschedule) {
        container.innerHTML = "<h3>Error: No schedules data found.</h3>";
        return;
    }

    const schedules = data.schedules;
    const results = data.results || {}; 

    // Read the custom data attribute from the container (defaults to 'draft' if missing)
    const draftNodeName = container.dataset.draftNode || 'draft';
    
    // Dynamically fetch either data.draft or data.workdraft based on the HTML
    const drafts = data[draftNodeName] || {};

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

    // --- NEW: Calculate "Yesterday" ---
    // We create a date object for right now, then subtract 1 day.
    // Setting the hours/minutes to 0 ensures we do a clean day-to-day comparison.
    const today = new Date();
    const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);

    // Create an empty string to hold all the HTML we generate
    let htmlOutput = ''; 
    let currentDateHeader = ''; 

    // 5. Loop through sorted matches
    matchArray.forEach(match => {
        // --- US Date and Time Formatting ---
        const matchDateString = match.date || '';
        let datePart = 'TBD';
        let timePart = 'TBD';

        const parsedDate = new Date(matchDateString);
        
        if (!isNaN(parsedDate.getTime())) {
            datePart = parsedDate.toLocaleDateString('en-US', {
                weekday: 'long', 
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
            
            timePart = parsedDate.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        } else {
            const parts = matchDateString.split(' ');
            if (parts[0]) datePart = parts[0];
            if (parts[1]) timePart = parts[1].substring(0, 5);
        }
        // ----------------------------------------

        // Check if the date has changed. 
        if (datePart !== currentDateHeader) {
            // If this is NOT the first date, we must close the previous <details> tag
            if (currentDateHeader !== '') {
                htmlOutput += `</div></details>`;
            }
            
            // --- NEW: Determine if the details tag should be open ---
            let openAttribute = 'open'; // Default to open
            
            if (!isNaN(parsedDate.getTime())) {
                // Strip the time from the match date so we strictly compare the days
                const matchDay = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
                
                // If the match day is strictly older than yesterday, remove the 'open' attribute
                if (matchDay < yesterday) {
                    openAttribute = ''; 
                }
            }
            
            // Open a new <details> block using our dynamic openAttribute.
            htmlOutput += `
                <details class="date-group" ${openAttribute}>
                    <summary class="date-header">${datePart}</summary>
                    <div class="match-list">
            `;
            currentDateHeader = datePart; 
        }

        // MERGE RESULTS
        const matchResult = results[match.matchId] || {};
        const status = matchResult.status || 'Scheduled';
        
        let statusClass = '';
        if (status === 'Finished') {
            statusClass = 'status-finished';
        } else if (status === 'In_Play' || status === 'Paused') {
            statusClass = 'status-live';
        }

        const scoreDisplay = (status === 'Finished' || status === 'In_Play' || status === 'Paused') 
            ? `<div class="score" style="font-size: 1.2em; font-weight: bold;">${matchResult.homeScore ?? '-'} : ${matchResult.awayScore ?? '-'}</div>` 
            : `<div class="time">${timePart}</div>`;

        const stageText = match.stage || '';
        const homeFamily = getFamilyByName(match.homeTeam);
        const awayFamily = getFamilyByName(match.awayTeam);

        // Append the match row
        htmlOutput += `
            <div class="match-row ${statusClass}">
                <div class="team-left">
                    <span class="team-name">${match.homeTeam}</span>
                    <img src="${match.homeFlag}" alt="${match.homeTeam}" class="team-flag">
                    <span class="family-name">${homeFamily}</span>
                </div>
                
                <div class="match-info">
                    <div class="stage">${stageText}</div>
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

    // We must close the very last <details> block after the loop finishes
    if (currentDateHeader !== '') {
        htmlOutput += `</div></details>`;
    }

    // Inject the fully built HTML string into the container all at once
    container.innerHTML = htmlOutput;
});
