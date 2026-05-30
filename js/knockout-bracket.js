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
    'FINAL': 'Final',
    'THIRD_PLACE': 'Third Place Play-off'
};

// Order dictates how columns render left-to-right
const knockoutStages = ['LAST_32', 'LAST_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'FINAL', 'THIRD_PLACE'];

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
    console.log("Bracket Script: Data fetched from Firebase successfully.");
    const data = snapshot.val();
    
    let container = document.getElementById('bracket-container');
    
    // Failsafe if the HTML div is missing
    if (!container) {
        console.warn("WARNING: <div id='bracket-container'></div> is missing from your HTML! Creating a temporary one at the bottom of the page.");
        container = document.createElement('div');
        container.id = 'bracket-container';
        document.body.appendChild(container);
    }

    if (!data || !data.schedules) {
        container.innerHTML = "<h3>Error: No schedules data found in database.</h3>";
        return;
    }

    const schedules = data.schedules;
    const results = data.results || {}; 

    // 3. Build match array safely
    let matchArray = [];
    Object.keys(schedules).forEach(key => {
        const matchData = schedules[key];
        if (matchData && typeof matchData === 'object' && matchData.stage) {
            matchArray.push({ matchId: key, ...matchData });
        }
    });

    // Sort chronologically 
    matchArray.sort((a, b) => {
        const dateA = a.utcDate ? new Date(a.utcDate) : new Date(a.date);
        const dateB = b.utcDate ? new Date(b.utcDate) : new Date(b.date);
        return dateA - dateB;
    });

    // 4. Filter for Knockouts and Group by Stage
    const bracketData = {};
    knockoutStages.forEach(stage => { bracketData[stage] = []; });

    let knockoutCount = 0;
    matchArray.forEach(match => {
        const normStage = normalizeStage(match.stage);
        if (knockoutStages.includes(normStage)) {
            match.normalizedStage = normStage; 
            if (bracketData[normStage] !== undefined) {
                bracketData[normStage].push(match);
                knockoutCount++;
            }
        }
    });

    console.log(`Bracket Script: Found ${matchArray.length} total matches.`);
    console.log(`Bracket Script: Filtered down to ${knockoutCount} KNOCKOUT matches.`);

    // 5. Generate Bracket HTML
    let htmlOutput = `<div class="bracket-layout">`;

    // Loop through the strict knockoutStages array to build columns sequentially
    knockoutStages.forEach(stageKey => {
        const matches = bracketData[stageKey];
        
        // Skip rendering the column if there are no matches for it yet
        if (matches.length === 0) return; 

        const displayTitle = stageDisplayNames[stageKey] || stageKey;

        htmlOutput += `
            <div class="bracket-column">
                <h3 class="bracket-stage-header">${displayTitle}</h3>
        `;

        matches.forEach(match => {
            const matchResult = results[match.matchId] || {};
            const homeScore = matchResult.homeScore ?? '-';
            const awayScore = matchResult.awayScore ?? '-';

            // Clean Flag Implementation relying purely on CSS
            const homeFlagHtml = match.homeFlag 
                ? `<img src="${match.homeFlag}" class="bracket-flag" alt="">` 
                : `<div class="bracket-flag-placeholder"></div>`;
                
            const awayFlagHtml = match.awayFlag 
                ? `<img src="${match.awayFlag}" class="bracket-flag" alt="">` 
                : `<div class="bracket-flag-placeholder"></div>`;

            htmlOutput += `
                <div class="bracket-match-box">
                    <div class="bracket-team">
                        <div>
                            ${homeFlagHtml}
                            <span>${match.homeTeam || 'TBD'}</span>
                        </div>
                        <span class="bracket-score">${homeScore}</span>
                    </div>
                    <div class="bracket-team">
                        <div>
                            ${awayFlagHtml}
                            <span>${match.awayTeam || 'TBD'}</span>
                        </div>
                        <span class="bracket-score">${awayScore}</span>
                    </div>
                </div>
            `;
        });

        htmlOutput += `</div>`; 
    });

    htmlOutput += `</div>`; 
    
    if (knockoutCount === 0) {
        htmlOutput = '<p>No knockout matches are scheduled yet.</p>';
    }

    container.innerHTML = htmlOutput;
});
