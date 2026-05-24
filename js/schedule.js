import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";
import { extractDateFromField } from "./dateUtils.js";

const db = getDatabase();

// Targeting the 'matches' folder directly
onValue(ref(db, 'matches'), (snapshot) => {
    const matchesByDate = snapshot.val(); // This is the object containing all dates
    const data = snapshot.val(); // Accessing global data if you need 'countries'
    
    // We need the 'countries' list too, so let's fetch the root instead
    // to ensure we can look up flag URLs correctly.
});

// BETTER APPROACH: Fetch the root to get both matches and countries
onValue(ref(db), (snapshot) => {
    const data = snapshot.val();
    const matchesByDate = data.matches || {}; 
    const countries = data.countries || {};
    const container = document.getElementById('schedule-container');
    container.innerHTML = ''; 

    // 1. Get the dates and sort them alphabetically (since YYYY-MM-DD sorts naturally)
    const sortedDates = Object.keys(matchesByDate).sort();

    // 2. Loop through the SORTED dates
    sortedDates.forEach(dateKey => {
        const dailyMatches = matchesByDate[dateKey];
        
        // Optional: Add a date header row here!
        container.innerHTML += `<div class="date-header"><h3>${dateKey}</h3></div>`;
        
        Object.values(dailyMatches).forEach(match => {
            // ... (your existing match-row rendering code)
        });
    });
});
