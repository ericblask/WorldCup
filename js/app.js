import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

// 1. YOUR PROJECT CONFIGURATION
// Go to Firebase Console -> Project Settings -> General -> Your apps -> Firebase SDK snippet
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "worldcup2026-5219e.firebaseapp.com",
    databaseURL: "https://worldcup2026-5219e-default-rtdb.firebaseio.com/",
    projectId: "worldcup2026-5219e",
    storageBucket: "worldcup2026-5219e.appspot.com",
    messagingSenderId: "1089995362453",
    appId: "1:1089995362453:web:976781ec8aaf63477c0b9c"
};

// 2. INITIALIZE FIREBASE
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 3. FETCH AND RENDER DATA
const countriesRef = ref(db, 'countries');

onValue(countriesRef, (snapshot) => {
    const countries = snapshot.val();
    const tbody = document.getElementById('countries-body');
    
    if (!countries) return; // Safety check if data is empty
    
    tbody.innerHTML = ''; // Clear current rows

    Object.keys(countries).forEach(key => {
        const country = countries[key];
        const card = `
            <div class="country-card">
                <img src="${country.flagUrl}" alt="${country.name}">
                <h3>${country.name}</h3>
                <p>Group: ${country.group}</p>
                <p>Code: ${country.shortName}</p>
            </div>
        `;
        // Ensure your index.html has a <div id="countries-body"> instead of a <tbody>
        document.getElementById('countries-body').innerHTML += card;
    });
});
