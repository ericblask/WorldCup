import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

// 1. Firebase Configuration
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

// 2. Fetch data from Firebase
onValue(ref(db), (snapshot) => {
    const data = snapshot.val();
    const container = document.getElementById('standings-container');
    
    if (!data || !data.countries) {
        container.innerHTML = "<h3>Error: No data found in Firebase.</h3>";
        return;
    }

    // Access necessary nodes
    const countries = data.countries;
    const statsData = data.standings || data; // Adjust if stats are in a different node
    const drafts = data.draft || {}; 

    // Initialize the table structure
    let tableHTML = `
        <table class="standings-table">
            <thead>
                <tr>
                    <th>Pos</th>
                    <th>Team</th>
                    <th>Group</th>
                    <th>Family</th>
                    <th>MP</th>
                    <th>W</th>
                    <th>D</th>
                    <th>L</th>
                    <th>GF</th>
                    <th>GA</th>
                    <th>GD</th>
                    <th>Pts</th>
                </tr>
            </thead>
            <tbody>
    `;

    // 3. Process the data
    const standingsArray = [];
    
    for (const teamId in countries) {
        const country = countries[teamId];
        
        // Look up stats for this specific team ID
        const stats = statsData[teamId] || {
            playedGames: 0, won: 0, draw: 0, lost: 0,
            goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0
        };

        // Fetch family name from the 'draft' node using the teamId
        const familyName = (drafts[teamId] && drafts[teamId].family) 
            ? drafts[teamId].family 
            : '-';

        standingsArray.push({
            id: teamId,
            name: country.name,
            flag: country.flagUrl,
            group: country.group,
            family: familyName,
            stats: stats
        });
    }

    // 4. Sort by Points descending, then Goal Difference descending
    standingsArray.sort((a, b) => {
        if (b.stats.points !== a.stats.points) {
            return b.stats.points - a.stats.points;
        }
        return b.stats.goalDifference - a.stats.goalDifference;
    });

    // 5. Generate table rows
    standingsArray.forEach((team, index) => {
        tableHTML += `
            <tr>
                <td>${index + 1}</td>
                <td class="team-cell">
                    <img src="${team.flag}" alt="${team.name}" width="25" style="border: 1px solid #eee; margin-right: 8px;">
                    <span>${team.name}</span>
                </td>
                <td>${team.group}</td>
                <td style="font-weight: bold; color: #444;">${team.family}</td>
                <td>${team.stats.playedGames}</td>
                <td>${team.stats.won}</td>
                <td>${team.stats.draw}</td>
                <td>${team.stats.lost}</td>
                <td>${team.stats.goalsFor}</td>
                <td>${team.stats.goalsAgainst}</td>
                <td>${team.stats.goalDifference}</td>
                <td style="font-weight: bold;">${team.stats.points}</td>
            </tr>
        `;
    });

    tableHTML += `</tbody></table>`;

    // Inject the table into the HTML
    container.innerHTML = tableHTML;
});
