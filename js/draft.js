// draft.js

// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

// 1. YOUR FIREBASE CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyCKV4Q_7dJ_fPk6WK4rQs8GiZRvCKhgpng",
    authDomain: "worldcup2026-5219e.firebaseapp.com",
    databaseURL: "https://worldcup2026-5219e-default-rtdb.firebaseio.com/",
    projectId: "worldcup2026-5219e",
    storageBucket: "worldcup2026-5219e.appspot.com",
    messagingSenderId: "1089995362453",
    appId: "1:1089995362453:web:6cb7fb7f6666bad07c0b9c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Reference the root of your database to get both 'countries' and 'families'
const dbRef = ref(db);

// Listen for data from Firebase
onValue(dbRef, (snapshot) => {
    const data = snapshot.val();
    
    if (data) {
        renderDraftBoard(data);
    } else {
        document.getElementById('draft-board').innerHTML = '<p>No data found in the database.</p>';
    }
}, (error) => {
    console.error("Firebase Read Error:", error);
    document.getElementById('draft-board').innerHTML = '<p>Error loading data. Check console for details.</p>';
});


// Function to render the HTML once data is received
function renderDraftBoard(dbData) {
    // Safely fallback to empty objects if data is missing
    const countries = dbData.countries || {};
    const families = dbData.families || {};

    // 1. Group the countries by their group name (Group A, Group B, etc.)
    const groups = {};
    for (const key in countries) {
        const country = countries[key];
        if (!groups[country.group]) {
            groups[country.group] = [];
        }
        groups[country.group].push(country);
    }

    // Sort group names alphabetically (Group A, Group B ... Group L)
    const sortedGroupNames = Object.keys(groups).sort();

    // 2. Generate the dropdown options for families
    let familyOptions = '<option value="">-- Select Family --</option>';
    for (const key in families) {
        familyOptions += `<option value="${key}">${families[key].name}</option>`;
    }

    // 3. Render the tables
    const draftBoard = document.getElementById('draft-board');
    draftBoard.innerHTML = ''; // Clear the "Loading..." text
    
    sortedGroupNames.forEach(groupName => {
        // Create Table Element wrapper
        const tableWrapper = document.createElement('div');
        
        let tableHTML = `
            <table>
                <thead>
                    <tr>
                        <th colspan="2">${groupName}</th>
                        <th>Draft Selection</th>
                    </tr>
                </thead>
                <tbody>
        `;

        // Add rows for each country in the group
        groups[groupName].forEach(country => {
            tableHTML += `
                <tr>
                    <td class="flag-cell">
                        <img src="${country.flagUrl}" alt="${country.name} flag" class="flag-img">
                    </td>
                    <td>
                        <span class="country-name">${country.name}</span>
                    </td>
                    <td class="draft-cell">
                        <select>
                            ${familyOptions}
                        </select>
                    </td>
                </tr>
            `;
        });

        tableHTML += `
                </tbody>
            </table>
        `;
        
        tableWrapper.innerHTML = tableHTML;
        draftBoard.appendChild(tableWrapper);
    });
}
