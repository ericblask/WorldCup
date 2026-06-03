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

// --- 1. DEFINE MATCH NUMBERS FOR TOP AND BOTTOM HALVES ---
// Swapped from Left/Right arrays to Top/Bottom concept
const topHalfMatchNumbers = [
    73, 76, 74, 75, 78, 77, 79, 80, // Round of 32
    90, 89, 91, 92,                 // Round of 16
    97, 98,                         // Quarter-finals
    101                             // Semi-final
];

const bottomHalfMatchNumbers = [
    82, 81, 84, 83, 85, 88, 86, 87, // Round of 32
    93, 94, 95, 96,                 // Round of 16
    99, 100,                        // Quarter-finals
    102                             // Semi-final
];

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
    const drafts = data.draft || {}; 

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

    const getMatchOrder = (matchNum) => {
        if (topHalfMatchNumbers.includes(matchNum)) return topHalfMatchNumbers.indexOf(matchNum);
        if (bottomHalfMatchNumbers.includes(matchNum)) return bottomHalfMatchNumbers.indexOf(matchNum);
        return 999; 
    };

    matchArray.sort((a, b) => getMatchOrder(a.matchNumber) - getMatchOrder(b.matchNumber));

    // Update object keys to "top" and "bottom"
    const bracketData = {
        top: { 'LAST_32': [], 'LAST_16': [], 'QUARTER_FINALS': [], 'SEMI_FINALS': [] },
        bottom: { 'LAST_32': [], 'LAST_16': [], 'QUARTER_FINALS': [], 'SEMI_FINALS': [] },
        center: { 'FINAL': [], 'THIRD_PLACE': [] }
    };

    matchArray.forEach(match => {
        const stage = match.normalizedStage;
        const matchNum = match.matchNumber;
        
        if (stage === 'FINAL' || stage === 'THIRD_PLACE' || matchNum === 104 || matchNum === 103) {
            bracketData.center[stage].push(match);
        } else if (topHalfMatchNumbers.includes(matchNum)) {
            bracketData.top[stage].push(match);
        } else if (bottomHalfMatchNumbers.includes(matchNum)) {
            bracketData.bottom[stage].push(match);
        } else {
            if (bracketData.top[stage].length <= bracketData.bottom[stage].length) {
                bracketData.top[stage].push(match);
            } else {
                bracketData.bottom[stage].push(match);
            }
        }
    });

    const getFamilyByName = (teamName) => {
        if (!teamName || teamName === 'TBD') return '';
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

    const createMatchHTML = (match) => {
        const matchResult = results[match.matchId] || {};
        const status = matchResult.status || 'Scheduled'; // Check if finished
        const homeScore = matchResult.homeScore ?? '-';
        const awayScore = matchResult.awayScore ?? '-';

        // Integrate Winner shading logic!
        let homeWinnerClass = '';
        let awayWinnerClass = '';

        if (status === 'Finished') {
            const hScore = parseInt(homeScore, 10);
            const aScore = parseInt(awayScore, 10);
            
            if (!isNaN(hScore) && !isNaN(aScore)) {
                if (hScore > aScore) {
                    homeWinnerClass = 'winner';
                } else if (aScore > hScore) {
                    awayWinnerClass = 'winner';
                }
            }
        }

        const homeFlagHtml = match.homeFlag ? `<img src="${match.homeFlag}" class="bracket-flag" alt="">` : `<div class="bracket-flag-placeholder"></div>`;
        const awayFlagHtml = match.awayFlag ? `<img src="${match.awayFlag}" class="bracket-flag" alt="">` : `<div class="bracket-flag-placeholder"></div>`;

        const homeFamily = getFamilyByName(match.homeTeam);
        const awayFamily = getFamilyByName(match.awayTeam);

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
        } else if (matchDateString) {
            const parts = matchDateString.split(' ');
            if (parts[0]) datePart = parts[0];
            if (parts[1]) timePart = parts[1].substring(0, 5);
        }

        const dateTimeDisplay = (datePart !== 'TBD' || timePart !== 'TBD') 
            ? `${datePart} <br> ${timePart}` 
            : 'Date TBD';

        return `
            <div class="bracket-match-box">
                <div class="bracket-match-time">
                    ${dateTimeDisplay} <br> 
                    <span style="color: #d9534f; font-weight: bold;">(Match #${match.matchNumber || '?'})</span>
                </div>
                <div class="bracket-team ${homeWinnerClass}">
                    <div class="bracket-team-info">
                        ${homeFlagHtml}
                        <div class="bracket-names">
                            <span class="bracket-team-name">${match.homeTeam || 'TBD'}</span>
                            ${homeFamily ? `<span class="bracket-family">${homeFamily}</span>` : ''}
                        </div>
                    </div>
                    <span class="bracket-score">${homeScore}</span>
                </div>
                <div class="bracket-team ${awayWinnerClass}">
                    <div class="bracket-team-info">
                        ${awayFlagHtml}
                        <div class="bracket-names">
                            <span class="bracket-team-name">${match.awayTeam || 'TBD'}</span>
                            ${awayFamily ? `<span class="bracket-family">${awayFamily}</span>` : ''}
                        </div>
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
        colHtml += `<div class="bracket-matches">`;
        matches.forEach(match => { colHtml += createMatchHTML(match); });
        colHtml += `</div></div>`; 
        return colHtml;
    };

    // Constructing the new Top/Bottom layout using inline flexbox
    let htmlOutput = `<div class="vertical-bracket-wrapper" style="display: flex; flex-direction: row; gap: 40px; width: max-content; padding: 20px;">`;

    // LEFT SECTION: Contains the Top and Bottom Halves stacked vertically
    htmlOutput += `<div class="bracket-halves-container" style="display: flex; flex-direction: column; gap: 50px;">`;

    // TOP HALF (Flows left to right: R32 -> R16 -> QF -> SF)
    htmlOutput += `<div class="bracket-side top-side" style="display: flex; flex-direction: row; gap: 20px;">`;
    ['LAST_32', 'LAST_16', 'QUARTER_FINALS', 'SEMI_FINALS'].forEach(stage => {
        htmlOutput += createColumnHTML(bracketData.top[stage], stage);
    });
    htmlOutput += `</div>`;

    // BOTTOM HALF (Flows left to right: R32 -> R16 -> QF -> SF)
    htmlOutput += `<div class="bracket-side bottom-side" style="display: flex; flex-direction: row; gap: 20px;">`;
    ['LAST_32', 'LAST_16', 'QUARTER_FINALS', 'SEMI_FINALS'].forEach(stage => {
        // Now it builds left to right same as the top half!
        htmlOutput += createColumnHTML(bracketData.bottom[stage], stage);
    });
    htmlOutput += `</div>`;
    
    htmlOutput += `</div>`; // Close bracket-halves-container

    // RIGHT SECTION: The Finals and Third Place
    htmlOutput += `<div class="bracket-center finals-section" style="display: flex; flex-direction: column; justify-content: center; gap: 40px; border-left: 2px dashed #ccc; padding-left: 40px;">`;
    
    if (bracketData.center['FINAL'] && bracketData.center['FINAL'].length > 0) {
        htmlOutput += `
            <div class="championship-wrapper">
                <h2 style="text-align: center;">World Cup Final</h2>
                ${createMatchHTML(bracketData.center['FINAL'][0])}
            </div>
        `;
    }
    if (bracketData.center['THIRD_PLACE'] && bracketData.center['THIRD_PLACE'].length > 0) {
        htmlOutput += `
            <div class="third-place-wrapper">
                <h3 style="text-align: center;">Third Place Play-off</h3>
                ${createMatchHTML(bracketData.center['THIRD_PLACE'][0])}
            </div>
        `;
    }
    htmlOutput += `</div></div>`; // Close finals-section and vertical-bracket-wrapper

    container.innerHTML = htmlOutput;

    // ENABLE DESKTOP DRAG-TO-SCROLL (Still works perfectly with the new layout)
    const slider = document.getElementById('bracket-container');
    if (slider) {
        let isDown = false;
        let startX;
        let scrollLeft;

        slider.addEventListener('mousedown', (e) => {
            isDown = true;
            slider.classList.add('active-drag');
            startX = e.pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;
        });
        slider.addEventListener('mouseleave', () => {
            isDown = false;
            slider.classList.remove('active-drag');
        });
        slider.addEventListener('mouseup', () => {
            isDown = false;
            slider.classList.remove('active-drag');
        });
        slider.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault(); 
            const x = e.pageX - slider.offsetLeft;
            const walk = (x - startX) * 1.5; 
            slider.scrollLeft = scrollLeft - walk;
        });
    }
});
