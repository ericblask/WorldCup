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

// 1. Prevent "Firebase App already exists" error safely
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

// 2. Safely matches the database strings
const normalizeStage = (stageStr) => {
    if (!stageStr) return 'UNKNOWN';
    const s = String(stageStr).toUpperCase();
    
    if (s.includes('32')) return 'LAST_32';
    if (s.includes('16')) return 'LAST_16';
    if (s.includes('QUARTER')) return 'QUARTER_FINALS';
    if (s.includes('SEMI')) return 'SEMI_FINALS';
    if (s.includes('THIRD') || s.includes('3RD')) return 'THIRD_PLACE';
    if (s.includes('FINAL')) return 'FINAL'; 
    
    return 'GROUP'; 
};

onValue(ref(db), (snapshot) => {
    console.log("Knockout Script: Data fetched from Firebase successfully.");
    const data = snapshot.val();
    
    let container = document.getElementById('vertical-knockout-container');
    
    // --- NEW: Failsafe if the HTML div is missing ---
    if (!container) {
        console.warn("WARNING: <div id='vertical-knockout-container'></div> is missing from your HTML! Creating a temporary one at the bottom of the page.");
        container = document.createElement('div');
        container.id = 'vertical-knockout-container';
        document.body.appendChild(container);
    }

    if (!data || !data.schedules) {
        container.innerHTML = "<h3>Error: No schedules data found in database.</h3>";
        return;
    }

    const schedules = data.schedules;
    const results = data.results || {}; 

    // Read the custom data attribute from the container (defaults to 'draft' if missing)
    const draftNodeName = container.dataset.draftNode || 'draft';
    
    // Dynamically fetch either data.draft or data.workdraft based on the HTML
    const drafts = data[draftNodeName] || {};

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

    // 3. Build match array
    let matchArray = [];
    Object.keys(schedules).forEach(key => {
        const matchData = schedules[key];
        if (matchData && typeof matchData === 'object' && matchData.stage) {
            matchArray.push({ matchId: key, ...matchData });
        }
    });

    matchArray.sort((a, b) => {
        const dateA = a.utcDate ? new Date(a.utcDate) : new Date(a.date);
        const dateB = b.utcDate ? new Date(b.utcDate) : new Date(b.date);
        return dateA - dateB;
    });

    // 4. Filter for Knockouts
    const knockoutMatches = [];
    matchArray.forEach(match => {
        const normStage = normalizeStage(match.stage);
        if (knockoutStages.includes(normStage)) {
            match.normalizedStage = normStage; 
            knockoutMatches.push(match);
        }
    });

    console.log(`Knockout Script: Found ${matchArray.length} total matches.`);
    console.log(`Knockout Script: Filtered down to ${knockoutMatches.length} KNOCKOUT matches.`);

    const roundsMap = new Map();
    knockoutMatches.forEach(match => {
        const stage = match.normalizedStage;
        if (!roundsMap.has(stage)) roundsMap.set(stage, []);
        roundsMap.get(stage).push(match);
    });

    const today = new Date();
    const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);

    let htmlOutput = ''; 

    knockoutStages.forEach((roundKey) => {
        if (!roundsMap.has(roundKey)) return; 
        
        const matchesInRound = roundsMap.get(roundKey);
        const displayTitle = stageDisplayNames[roundKey] || roundKey;
        
        // Removed the padding-left: 15px; from the round-content div below
        htmlOutput += `
            <details class="round-group" open style="margin-bottom: 1.5rem;">
                <summary class="round-summary" style="cursor: pointer; padding: 5px 0;">
                    <h2 class="round-header" style="display: inline; vertical-align: middle; margin-left: 5px;">${displayTitle}</h2>
                </summary>
                <div class="round-content" style="margin-top: 10px;">
        `;
        
        let currentDateHeader = ''; 

        matchesInRound.forEach(match => {
            const safeDateString = match.utcDate || match.date || '';
            const parsedDate = new Date(safeDateString);
            
            let datePart = 'TBD';
            let timePart = 'TBD';
            
            if (!isNaN(parsedDate.getTime())) {
                datePart = parsedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
                timePart = parsedDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            } else {
                const parts = (match.date || '').split(' ');
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
            let homeWinnerClass = ''; 
            let awayWinnerClass = ''; 

            if (status === 'Finished') {
                statusClass = 'status-finished';
                
                // Determine the winner based on the final score
                const homeScore = parseInt(matchResult.homeScore, 10);
                const awayScore = parseInt(matchResult.awayScore, 10);
                
                if (!isNaN(homeScore) && !isNaN(awayScore)) {
                    if (homeScore > awayScore) {
                        homeWinnerClass = 'winner';
                    } else if (awayScore > homeScore) {
                        awayWinnerClass = 'winner';
                    }
                }
            } else if (status === 'In_Play' || status === 'Paused') {
                statusClass = 'status-live';
            }

            const scoreDisplay = (status === 'Finished' || status === 'In_Play' || status === 'Paused') 
                ? `<div class="score" style="font-size: 1.2em; font-weight: bold;">${matchResult.homeScore ?? '-'} : ${matchResult.awayScore ?? '-'}</div>` 
                : `<div class="time">${timePart}</div>`;

            htmlOutput += `
                <div class="match-row ${statusClass}">
                    <div class="team-left ${homeWinnerClass}">
                        <span class="team-name">${match.homeTeam}</span>
                        ${match.homeFlag ? `<img src="${match.homeFlag}" alt="${match.homeTeam}" class="team-flag">` : `<div class="team-flag-placeholder"></div>`}
                        <span class="family-name">${getFamilyByName(match.homeTeam)}</span>
                    </div>
                    <div class="match-info">
                        ${scoreDisplay}
                    </div>
                    <div class="team-right ${awayWinnerClass}">
                        <span class="team-name">${match.awayTeam}</span>
                        ${match.awayFlag ? `<img src="${match.awayFlag}" alt="${match.awayTeam}" class="team-flag">` : `<div class="team-flag-placeholder"></div>`}
                        <span class="family-name">${getFamilyByName(match.awayTeam)}</span>
                    </div>
                </div>
            `;
        });

        if (currentDateHeader !== '') htmlOutput += `</div></details>`;
        htmlOutput += `</div></details>`; 
    });

    if (htmlOutput === '') {
        htmlOutput = '<p>No knockout matches are scheduled yet.</p>';
    }

    container.innerHTML = htmlOutput;
});
