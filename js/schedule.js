import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

const firebaseConfig = { /* Paste your config here */ };
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Fetch both matches and countries to map flags
onValue(ref(db), (snapshot) => {
    const data = snapshot.val();
    const matches = data.schedules; // Assuming this is your match list
    const countries = data.countries;
    const container = document.getElementById('schedule-container');

    Object.values(matches).forEach(match => {
        const home = countries[match.homeTeamId];
        const away = countries[match.awayTeamId];

        container.innerHTML += `
            <div class="match-row">
                <div class="team">
                    <img src="${home.flagUrl}" width="30"> ${home.shortName}
                </div>
                <div class="time">${match.date} - ${match.time}</div>
                <div class="team">
                    ${away.shortName} <img src="${away.flagUrl}" width="30">
                </div>
            </div>
        `;
    });
});
