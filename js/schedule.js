import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

const db = getDatabase();

onValue(ref(db, 'schedules'), (snapshot) => {
    const data = snapshot.val();
    const container = document.getElementById('schedule-container');
    
    // 1. If there's no data, print an error to the screen
    if (!data) {
        container.innerHTML = "<h3>Error: No data found at the 'schedules' path.</h3>";
        return;
    }

    // 2. Clear the container
    container.innerHTML = '<h2>Raw Schedule Data</h2>'; 

    // 3. Loop through whatever is there and print it as plain text
    Object.values(data).forEach(match => {
        container.innerHTML += `
            <div style="background: white; padding: 10px; margin-bottom: 10px; border: 1px solid black;">
                <p><strong>Teams:</strong> ${match.homeTeam} vs ${match.awayTeam}</p>
                <p><strong>Date:</strong> ${match.date}</p>
                <p style="font-size: 12px; color: gray;">Raw JSON: ${JSON.stringify(match)}</p>
            </div>
        `;
    });
});
