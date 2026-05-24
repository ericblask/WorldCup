import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";
import { extractDateFromField } from "./dateUtils.js";

const db = getDatabase();

onValue(ref(db), (snapshot) => {
    const data = snapshot.val();
    const matchesByDate = data.matches || {}; 
    const countries = data.countries || {};
    const container = document.getElementById('schedule-container');
    
    // Clear container
    container.innerHTML = ''; 

    // 1. Get dates and sort them alphabetically (YYYY-MM-DD ensures chronological order)
    const sortedDates = Object.keys(matchesByDate).sort();

    // 2. Loop through sorted dates
    sortedDates.forEach(dateKey => {
        const dailyMatches = matchesByDate[dateKey];
        
        // Add a Date Header
        container.innerHTML += `<div class="date-header"><h3>${dateKey}</h3></div>`;
        
        // 3. Loop through matches for this specific date
        Object.values(dailyMatches).forEach(match => {
            const home = countries[match.homeTeamId] || { name: 'TBD', flagUrl: '', shortName: 'TBD' };
            const away = countries[match.awayTeamId] || { name: 'TBD', flagUrl: '', shortName: 'TBD' };

            container.innerHTML += `
                <div class="match-row">
                    <div class="team-left">
                        <span class="team-name">${home.shortName}</span>
                        <img src="${home.flagUrl}" alt="${home.name}" width="30">
                    </div>
                    
                    <div class="match-info">
                        <div class="time">${match.time || 'TBD'}</div>
                    </div>

                    <div class="team-right">
                        <img src="${away.flagUrl}" alt="${away.name}" width="30">
                        <span class="team-name">${away.shortName}</span>
                    </div>
                </div>
            `;
        });
    });
});
