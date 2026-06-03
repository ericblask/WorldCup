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

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getDatabase(app);

// --- MASTER MATCH ORDER ---
// Matches are ordered by round, with the bottom half appended to the top half
const orderedMatchNumbers = [
    // Round of 32
    73, 76, 74, 75, 78, 77, 79, 80, 82, 81, 84, 83, 85, 88, 86, 87,
    // Round of 16
    90, 89, 91, 92, 93, 94, 95, 96,
    // Quarter-finals
    97, 98, 99, 100,
    // Semi-finals
    101, 102,
    // Third Place, Final
    103, 104
];

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

    // Sort entirely by the master order list
    matchArray.sort((a, b) => {
        const indexA = orderedMatchNumbers.indexOf(a.matchNumber);
        const indexB = orderedMatchNumbers.indexOf(b.matchNumber);
        return (indexA !== -1 ? indexA : 999) - (indexB !== -1 ? indexB : 999);
    });

    // Group matches into columns
    const bracketData = {
        'LAST_32': [],
        'LAST_16': [],
        'QUARTER_FINALS': [],
        'SEMI_FINALS': [],
        'FINALS': [] // Contains both Third Place and Final
    };

    matchArray.forEach(match => {
        const stage = match.normalizedStage;
        if (stage === 'FINAL' || stage === 'THIRD_PLACE') {
            bracketData['FINALS'].push(match);
        } else if (bracketData[stage]) {
            bracketData[stage].push(match);
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
        const status = matchResult.status || 'Scheduled';
        const homeScore = matchResult.homeScore ?? '-';
        const awayScore = matchResult.awayScore ?? '-';

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
            datePart = parsedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            timePart = parsedDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        } else if (matchDateString) {
            const parts = matchDateString.split(' ');
            if (parts[0]) datePart = parts[0];
            if (parts[1]) timePart = parts[1].substring(0, 5);
        }

        const dateTimeDisplay = (datePart !== 'TBD' || timePart !== 'TBD') ? `${datePart} - ${timePart}` : 'Date TBD';
        
        // Add a small label if this is specifically the Final or Third Place match
        let titleLabel = '';
        if (match.normalizedStage === 'FINAL') titleLabel = `<div style="font-weight: bold; color: #004b87; margin-bottom: 3px; text-align: center;">World Cup Final</div>`;
        if (match.normalizedStage === 'THIRD_PLACE') titleLabel = `<div style="font-weight: bold; color: #555; margin-bottom: 3px; text-align: center;">Third Place Play-off</div>`;

        return `
            <div class="bracket-match-box" style="margin-bottom: 15px;">
                ${titleLabel}
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

    // Columns configuration to render left-to-right
    const stagesInOrder = [
        { key: 'LAST_32', title: 'Round of 32' },
        { key: 'LAST_16', title: 'Round of 16' },
        { key: 'QUARTER_FINALS', title: 'Quarter-Finals' },
        { key: 'SEMI_FINALS', title: 'Semi-Finals' },
        { key: 'FINALS', title: 'Finals' }
    ];

    let htmlOutput = `<div class="simple-bracket-wrapper" style="display: flex; flex-direction: row; gap: 30px; width: max-content; padding: 20px;">`;

    stagesInOrder.forEach(stageInfo => {
        const matches = bracketData[stageInfo.key];
        if (matches && matches.length > 0) {
            htmlOutput += `<div class="bracket-column" style="display: flex; flex-direction: column; min-width: 260px;">`;
            htmlOutput += `<h3 class="bracket-stage-header" style="text-align: center; border-bottom: 2px solid #ddd; padding-bottom: 10px; margin-bottom: 15px; position: sticky; top: 0; background: #f4f7f6; z-index: 2;">${stageInfo.title}</h3>`;
            htmlOutput += `<div class="bracket-matches">`;
            matches.forEach(match => {
                htmlOutput += createMatchHTML(match);
            });
            htmlOutput += `</div></div>`;
        }
    });

    htmlOutput += `</div>`;
    container.innerHTML = htmlOutput;

    // ENABLE DESKTOP DRAG-TO-SCROLL
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
