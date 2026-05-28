import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyCKV4Q_7dJ_fPk6WK4rQs8GiZRvCKhgpng",
    authDomain: "worldcup2026-5219e.firebaseapp.com",
    databaseURL: "https://worldcup2026-5219e-default-rtdb.firebaseio.com/",
    projectId: "worldcup2026-5219e",
    storageBucket: "worldcup2026-5219e.appspot.com",
    messagingSenderId: "1089995362453",
    appId: "1:1089995362453:web:6cb7fb7f6666bad07c0b9c"
};

// 1. Prevent "Firebase App already exists" error if schedule.js is on the same page
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getDatabase(app);

// Map standard keys to user-friendly titles
const stageDisplayNames = {
    'LAST_32': 'Round of 32',
    'LAST_16': 'Round of 16',
    'QUARTER_FINALS': 'Quarter-Finals',
    'SEMI_FINALS': 'Semi-Finals',
    'THIRD_PLACE': 'Third Place Play-off',
    'FINAL': 'Final'
};

const knockoutStages = ['LAST_32', 'LAST_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'THIRD_PLACE', 'FINAL'];

// 2. Helper to map different database string formats (e.g. "Round of 16") to our standard keys
const normalizeStage = (stageStr) => {
    if (!stageStr) return 'UNKNOWN';
    const s = stageStr.toUpperCase().replace(/[-\s_]+/g, '');
    if (s.includes('32')) return 'LAST_32';
    if (s.includes('16')) return 'LAST_16';
    if (s.includes('QUARTER')) return 'QUARTER_FINALS';
    if (s.includes('SEMI')) return 'SEMI_FINALS';
    if (s.includes('THIRD') || s.includes('3RD')) return 'THIRD_PLACE';
    if (s === 'FINAL' || s === 'FINALS') return 'FINAL';
    return stageStr; // Fallback
};

onValue(ref(db), (snapshot) => {
    const data = snapshot.val();
    const container = document.getElementById('vertical-knockout-container');
    
    // Safety check in case the container isn't in the HTML
    if (!container) {
        console.warn("Container 'vertical-knockout-container' not found in the HTML.");
        return;
    }

    if (!data || !data.schedules) {
        container.innerHTML = "<h3>Error: No schedules data found.</h3>";
        return;
    }

    const schedules = data.schedules;
    const results = data.results || {}; 
    const drafts = data.draft || {};

    const getFamilyByName = (teamName) => {
        for (const famKey in drafts) {
            const familyData = drafts[famKey];
            if (familyData && familyData.countries) {
                const draftedCountries = Object.values(familyData.countries);
                for (const country of draftedCountries) {
                    if (country.name === teamName) return familyData.name || ''; 
                }
            }
        }
        return ''; 
    };

    let matchArray = Object.keys(schedules).map(key => ({
        matchId: key, 
        ...schedules[key]
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    // FLEXIBLE MATCH FILTERING FOR KNOCKOUTS
    const knockoutMatches = [];
    matchArray.forEach(match => {
        const normStage = normalizeStage(match.stage);
        if (knockoutStages.includes(normStage)) {
            match.normalizedStage = normStage; // Save the normalized version for grouping
            knockoutMatches.push(match);
        }
    });

    const roundsMap = new Map();
    knockoutMatches.forEach(match => {
        const stage = match.normalizedStage;
        if (!roundsMap.has(stage)) roundsMap.set(stage, []);
        roundsMap.get(stage).push(match);
    });

    const today = new Date();
    const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);

    let htmlOutput = ''; 

    // Iterate over knockoutStages to ensure they print in the correct tournament order
    knockoutStages.forEach((roundKey) => {
        if (!roundsMap.has(roundKey)) return; // Skip if no matches for this round yet
        
        const matchesInRound = roundsMap.get(roundKey);
        const displayTitle = stageDisplayNames[roundKey] || roundKey;
        
        htmlOutput += `<div class="round-group"><h2 class="round-header">${displayTitle}</h2>`;
        
        let currentDateHeader = ''; 

        matchesInRound.forEach(match => {
            const matchDateString = match.date || '';
            let datePart = 'TBD';
            let timePart = 'TBD';
            const parsedDate = new Date(matchDateString);
            
            if (!isNaN(parsedDate.getTime())) {
                datePart = parsedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
                timePart = parsedDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            } else {
                const parts = matchDateString.split(' ');
                if (parts[0]) datePart = parts[0];
                if (parts[1]) timePart = parts[1].substring(0, 5);
            }

            if (datePart !== currentDateHeader) {
                if (currentDateHeader !== '') htmlOutput += `</div></details>`;
                
                let openAttribute = 'open'; 
                if (!isNaN(parsedDate.getTime())) {
                    const matchDay = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
                    if (matchDay < yesterday) openAttribute = ''; 
                }
                
                htmlOutput += `
                    <details class="date-group" ${openAttribute}>
                        <summary class="date-header">${datePart}</summary>
                        <div class="match-list">
                `;
                currentDateHeader = datePart; 
            }

            const matchResult = results[match.matchId] || {};
            const status = matchResult.status || 'Scheduled';
            
            let statusClass = '';
            if (status === 'Finished') statusClass = 'status-finished';
            else if (status === 'In_Play' || status === 'Paused') statusClass = 'status-live';

            const scoreDisplay = (status === 'Finished' || status === 'In_Play' || status === 'Paused') 
                ? `<div class="score" style="font-size: 1.2em; font-weight: bold;">${matchResult.homeScore ?? '-'} : ${matchResult.awayScore ?? '-'}</div>` 
                : `<div class="time">${timePart}</div>`;

            htmlOutput += `
                <div class="match-row ${statusClass}">
                    <div class="team-left">
                        <span class="team-name">${match.homeTeam}</span>
                        <img src="${match.homeFlag}" alt="${match.homeTeam}" class="team-flag">
                        <span class="family-name">${getFamilyByName(match.homeTeam)}</span>
                    </div>
                    <div class="match-info">
                        ${scoreDisplay}
                    </div>
                    <div class="team-right">
                        <span class="team-name">${match.awayTeam}</span>
                        <img src="${match.awayFlag}" alt="${match.awayTeam}" class="team-flag">
                        <span class="family-name">${getFamilyByName(match.awayTeam)}</span>
                    </div>
                </div>
            `;
        });

        if (currentDateHeader !== '') htmlOutput += `</div></details>`;
        htmlOutput += `</div>`; // Close round-group
    });

    // 3. Prevent rendering blank empty tags if no knockout games exist yet
    if (htmlOutput === '') {
        htmlOutput = '<p>No knockout matches are scheduled yet.</p>';
    }

    container.innerHTML = htmlOutput;
});
