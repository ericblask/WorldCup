import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

// Firebase Configuration
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

onValue(ref(db), (snapshot) => {
    const data = snapshot.val();
    const container = document.getElementById('standings-container');
    
    if (!data || !data.countries) {
        container.innerHTML = "<h3>No data found.</h3>";
        return;
    }

    const { countries, draft: drafts = {}, standings: statsData = {} } = data;
    
    // 1. Organize data by 'group'
    const groupedData = {};

    for (const teamId in countries) {
        const country = countries[teamId];
        const stats = statsData[teamId] || { 
            points: 0, goalDifference: 0, goalsFor: 0, 
            playedGames: 0, won: 0, draw: 0, lost: 0, goalsAgainst: 0 
        };
        const familyName = drafts[teamId]?.family || '-';
        
        const groupKey = country.group || "Unknown";
        if (!groupedData[groupKey]) groupedData[groupKey] = [];
        
        groupedData[groupKey].push({ ...country, stats, family: familyName });
    }

    // 2. Sort groups alphabetically and teams by criteria
    const sortedGroupKeys = Object.keys(groupedData).sort();
    let finalHTML = '';

    sortedGroupKeys.forEach(groupKey => {
        // Sort teams: Points -> Goal Difference -> Goals For
        const teams = groupedData[groupKey].sort((a, b) => 
            b.stats.points - a.stats.points || 
            b.stats.goalDifference - a.stats.goalDifference || 
            b.stats.goalsFor - a.stats.goalsFor
        );

        finalHTML += `
            <h3>${groupKey}</h3>
            <table class="standings-table">
                <thead>
                    <tr>
                        <th>Team</th>
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

        teams.forEach(team => {
            finalHTML += `
                <tr>
                    <td class="team-cell">
                        <img src="${team.flagUrl}" class="team-flag" alt="${team.name}"> 
                        ${team.name}
                    </td>
                    <td style="font-weight:bold">${team.family}</td>
                    <td>${team.stats.playedGames}</td>
                    <td>${team.stats.won}</td>
                    <td>${team.stats.draw}</td>
                    <td>${team.stats.lost}</td>
                    <td>${team.stats.goalsFor}</td>
                    <td>${team.stats.goalsAgainst}</td>
                    <td>${team.stats.goalDifference}</td>
                    <td style="font-weight:bold">${team.stats.points}</td>
                </tr>
            `;
        });
        finalHTML += `</tbody></table>`;
    });

    container.innerHTML = finalHTML;
});
