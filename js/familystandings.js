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

// 1. Read the custom data attribute from the container (defaults to 'draft')
const draftNodeName = container.dataset.draftNode || 'draft';

// 2. Use the dynamic variable in your destructuring assignment
const { 
    countries, 
    [draftNodeName]: drafts = {}, 
    standings: statsData = {} 
} = data;
    
    // Helper function to find family by drafted country name
    const getFamilyByName = (teamName) => {
        for (const famKey in drafts) {
            const familyData = drafts[famKey];
            
            if (familyData && familyData.countries) {
                const draftedCountries = Object.values(familyData.countries);
                
                for (const country of draftedCountries) {
                    if (country.name === teamName) {
                        return familyData.name || '-'; 
                    }
                }
            }
        }
        return '-'; 
    };

    // 1. Initialize family aggregation object
    const familyAggregates = {};

    // 2. Aggregate stats by family
    for (const teamId in countries) {
        const country = countries[teamId];
        const stats = statsData[teamId] || { 
            points: 0, goalDifference: 0, goalsFor: 0, 
            playedGames: 0, won: 0, draw: 0, lost: 0, goalsAgainst: 0 
        };
        
        const familyName = getFamilyByName(country.name);
        
        // Only process teams that have been drafted by a family
        if (familyName !== '-') {
            // Create the family entry if it doesn't exist yet
            if (!familyAggregates[familyName]) {
                familyAggregates[familyName] = {
                    name: familyName,
                    points: 0,
                    goalDifference: 0,
                    goalsFor: 0,
                    playedGames: 0,
                    won: 0,
                    draw: 0,
                    lost: 0,
                    goalsAgainst: 0,
                    draftedTeams: [] // Keep track of their teams for the UI
                };
            }

            // Add the current country's stats to the family totals
            const fam = familyAggregates[familyName];
            fam.points += Number(stats.points) || 0;
            fam.goalDifference += Number(stats.goalDifference) || 0;
            fam.goalsFor += Number(stats.goalsFor) || 0;
            fam.playedGames += Number(stats.playedGames) || 0;
            fam.won += Number(stats.won) || 0;
            fam.draw += Number(stats.draw) || 0;
            fam.lost += Number(stats.lost) || 0;
            fam.goalsAgainst += Number(stats.goalsAgainst) || 0;
            
            // Save team details to display miniature flags
            fam.draftedTeams.push({ name: country.name, flagUrl: country.flagUrl });
        }
    }

    // 3. Convert aggregates to an array and sort by Points -> GD -> GF
    const sortedFamilies = Object.values(familyAggregates).sort((a, b) => 
        b.points - a.points || 
        b.goalDifference - a.goalDifference || 
        b.goalsFor - a.goalsFor
    );

    // 4. Generate the final HTML leaderboard
    let finalHTML = `
        <h3>Family Leaderboard</h3>
        <table class="standings-table">
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Family</th>
                    <th>Drafted Teams</th>
                    <th>MP</th>
                    <th>Pts</th>
                    <th>W</th>
                    <th>D</th>
                    <th>L</th>
                    <th>GF</th>
                    <th>GA</th>
                    <th>GD</th>
                </tr>
            </thead>
            <tbody>
    `;

    sortedFamilies.forEach((fam, index) => {
        // Map drafted teams to a string of flag images for a nice visual
        const flagsHtml = fam.draftedTeams.map(t => 
            `<img src="${t.flagUrl}" class="team-flag" title="${t.name}" alt="${t.name}" style="width: 24px; margin-right: 4px; vertical-align: middle;">`
        ).join('');

        finalHTML += `
            <tr>
                <td>${index + 1}</td>
                <td style="font-weight:bold">${fam.name}</td>
                <td>${flagsHtml}</td>
                <td>${fam.playedGames}</td>
                <td style="font-weight:bold; color: #d32f2f;">${fam.points}</td>
                <td>${fam.won}</td>
                <td>${fam.draw}</td>
                <td>${fam.lost}</td>
                <td>${fam.goalsFor}</td>
                <td>${fam.goalsAgainst}</td>
                <td>${fam.goalDifference}</td>
            </tr>
        `;
    });

    finalHTML += `</tbody></table>`;

    container.innerHTML = finalHTML;
});
