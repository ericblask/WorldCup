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

// Prevent "Firebase App already exists" error safely
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getDatabase(app);

// --- 1. DEFINE MATCH IDs FOR LEFT AND RIGHT SIDES ---
const leftSideMatchIds = [
    '537415', '537416', '537417', '537418', '537419', '537420', '537421', '537422', // Round of 32
    '537375', '537376', '537381', '537382', // Round of 16
    '537383', '537384', // Quarter-finals
    '537387' // Semi-final
];

const rightSideMatchIds = [
    '537423', '537424', '537425', '537426', '537427', '537428', '537429', '537430', // Round of 32
    '537377', '537378', '537379', '537380', // Round of 16
    '537385', '537386', // Quarter-finals
    '537388' // Semi-final
];

// Map standard keys to user-friendly titles
const stageDisplayNames = {
    'LAST_32': 'Round of 32',
    'LAST_16': 'Round of 16',
    'QUARTER_FINALS': 'Quarter-Finals',
    'SEMI_FINALS': 'Semi-Finals',
    'FINAL': 'World Cup Final',
    'THIRD_PLACE': 'Third Place'
};

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
    try {
        const data = snapshot.val();
        let container = document.getElementById('bracket-container');
        
        if (!container) {
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

        // Extract knockout matches safely
        let matchArray = [];
        Object.keys(schedules).forEach(key => {
            const matchData = schedules[key];
            if (matchData && matchData.stage) {
                const normStage = normalizeStage(matchData.stage);
                if (normStage !== 'GROUP' && normStage !== 'UNKNOWN') {
                    matchArray.push({ matchId: key, normalizedStage: normStage, ...matchData });
                }
            }
        });

        // Safely sort dates without returning NaN
        matchArray.sort((a, b) => {
            const dateA = new Date(a.utcDate || a.date);
            const dateB = new Date(b.utcDate || b.date);
            const timeA = isNaN(dateA.getTime()) ? 0 : dateA.getTime();
            const timeB = isNaN(dateB.getTime()) ? 0 : dateB.getTime();
            return timeA - timeB;
        });

        // --- 2. ORGANIZE DATA INTO LEFT, CENTER, AND RIGHT ---
        const bracketData = {
            left: { 'LAST_32': [], 'LAST_16': [], 'QUARTER_FINALS': [], 'SEMI_FINALS': [] },
            right: { 'LAST_32': [], 'LAST_16': [], 'QUARTER_FINALS': [], 'SEMI_FINALS': [] },
            center: { 'FINAL': [], 'THIRD_PLACE': [] }
        };

        matchArray.forEach(match => {
            const stage = match.normalizedStage;
            if (stage === 'FINAL' || stage === 'THIRD_PLACE') {
                bracketData.center[stage].push(match);
            } else if (leftSideMatchIds.includes(match.matchId)) {
                bracketData.left[stage].push(match);
            } else if (rightSideMatchIds.includes(match.matchId)) {
                bracketData.right[stage].push(match);
            } else {
                if (bracketData.left[stage].length <= bracketData.right[stage].length) {
                    bracketData.left[stage].push(match);
                } else {
                    bracketData.right[stage].push(match);
                }
            }
        });

        const createMatchHTML = (match) => {
            const matchResult = results[match.matchId] || {};
            const homeScore = matchResult.homeScore ?? '-';
            const awayScore = matchResult.awayScore ?? '-';

            const homeFlagHtml = match.homeFlag ? `<img src="${match.homeFlag}" class="bracket-flag" alt="">` : `<div class="bracket-flag-placeholder"></div>`;
            const awayFlagHtml = match.awayFlag ? `<img src="${match.awayFlag}" class="bracket-flag" alt="">` : `<div class="bracket-flag-placeholder"></div>`;

            // --- BULLETPROOF DATE AND TIME LOGIC ---
            let safeDateString = match.utcDate || match.date || '';
            safeDateString = String(safeDateString).trim();
            
            let datePart = 'TBD';
            let timePart = 'TBD';

            if (safeDateString) {
                const parsedDate = new Date(safeDateString);
                
                // If it's a valid standard Date
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
                    // Fallback for weird strings
                    const parts = safeDateString.split(' ');
                    if (parts[0]) datePart = parts[0];
                    if (parts[1]) timePart = String(parts[1]).substring(0, 5);
                }
            }

            // Using <br> to stack the date and time lines
            const dateTimeDisplay = (datePart !== 'TBD' || timePart !== 'TBD') 
                ? `${datePart}<br>${timePart}` 
                : 'Date TBD';

            return `
                <div class="bracket-match-box">
                    <div class="bracket-match-time">${dateTimeDisplay}</div>
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
        };

        const createColumnHTML = (matches, stageKey) => {
            if (!matches || matches.length === 0) return '';
            const displayTitle = stageDisplayNames[stageKey] || stageKey;
            let colHtml = `<div class="bracket-column"><h3 class="bracket-stage-header">${displayTitle}</h3>`;
            matches.forEach(match => { colHtml += createMatchHTML(match); });
            colHtml += `</div>`;
            return colHtml;
        };

        // --- 3. BUILD THE SPLIT BRACKET HTML ---
        let htmlOutput = `<div class="split-bracket-wrapper">`;

        // LEFT SIDE
        htmlOutput += `<div class="bracket-side left-side">`;
        ['LAST_32', 'LAST_16', 'QUARTER_FINALS', 'SEMI_FINALS'].forEach(stage => {
            htmlOutput += createColumnHTML(bracketData.left[stage], stage);
        });
        htmlOutput += `</div>`;

        // CENTER
        htmlOutput += `<div class="bracket-center">`;
        if (bracketData.center['FINAL'].length > 0) {
            htmlOutput += `
                <div class="championship-wrapper">
                    <h2>World Cup Final</h2>
                    ${createMatchHTML(bracketData.center['FINAL'][0])}
                </div>
            `;
        }
        if (bracketData.center['THIRD_PLACE'].length > 0) {
            htmlOutput += `
                <div class="third-place-wrapper">
                    <h3>Third Place Play-off</h3>
                    ${createMatchHTML(bracketData.center['THIRD_PLACE'][0])}
                </div>
            `;
        }
        htmlOutput += `</div>`;

        // RIGHT SIDE
        htmlOutput += `<div class="bracket-side right-side">`;
        ['SEMI_FINALS', 'QUARTER_FINALS', 'LAST_16', 'LAST_32'].forEach(stage => {
            htmlOutput += createColumnHTML(bracketData.right[stage], stage);
        });
        htmlOutput += `</div></div>`; 

        container.innerHTML = htmlOutput;
        
    } catch (error) {
        console.error("Bracket Error:", error);
        document.getElementById('bracket-container').innerHTML = `<p style="color:red;">An error occurred generating the bracket. Please check the console.</p>`;
    }
});
