import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

const db = getDatabase();

// Targeting the 'schedules' node directly as confirmed by your database structure
onValue(ref(db, 'schedules'), (snapshot) => {
    const schedules = snapshot.val();
    const container = document.getElementById('schedule-container');
    
    if (!schedules) {
        console.error("No data found at path 'schedules'!");
        return;
    }

    container.innerHTML = ''; 

    // 1. Convert the object of matches into an array and sort by the 'date' field
    const matchArray = Object.values(schedules);
    matchArray.sort((a, b) => new Date(a.date) - new Date(b.date));

    // 2. Loop through sorted matches
    matchArray.forEach(match => {
        // Extract time from the "YYYY-MM-DD HH:MM:SS" string
        const datePart = match.date.split(' ')[0];
        const timePart = match.date.split(' ')[1].substring(0, 5); // Gets "HH:MM"

        container.innerHTML += `
            <div class="match-row">
                <div class="team-left">
                    <span class="team-name">${match.homeTeam}</span>
                    <img src="${match.homeFlag}" alt="${match.homeTeam}" width="30">
                </div>
                
                <div class="match-info">
                    <div class="date">${datePart}</div>
                    <div class="time">${timePart}</div>
                </div>

                <div class="team-right">
                    <img src="${match.awayFlag}" alt="${match.awayTeam}" width="30">
                    <span class="team-name">${match.awayTeam}</span>
                </div>
            </div>
        `;
    });
});
