import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";
import { extractDateFromField } from "./dateUtils.js";

const db = getDatabase();

onValue(ref(db), (snapshot) => {
    const data = snapshot.val();
    const matches = Object.values(data.schedules || {});
    const countries = data.countries; // Used for looking up flags
    const container = document.getElementById('schedule-container');

    container.innerHTML = matches.map(match => {
        // Find the team details based on the IDs in your match
        const home = countries[match.homeTeamId] || { name: 'TBD', flagUrl: '', shortName: 'TBD' };
        const away = countries[match.awayTeamId] || { name: 'TBD', flagUrl: '', shortName: 'TBD' };

        return `
            <div class="match-row">
                <div class="team-left">
                    <span class="team-name">${home.shortName}</span>
                    <img src="${home.flagUrl}" alt="${home.name}" width="30">
                </div>
                
                <div class="match-info">
                    <div class="date">${extractDateFromField(match.date)}</div>
                    <div class="time">${match.time || 'TBD'}</div>
                </div>

                <div class="team-right">
                    <img src="${away.flagUrl}" alt="${away.name}" width="30">
                    <span class="team-name">${away.shortName}</span>
                </div>
            </div>
        `;
    }).join('');
});
