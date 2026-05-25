// draft.js

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

// 2. Initialize Firebase using the Compat syntax (Safely)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// 3. Reference the root of your database to get both 'countries' and 'families'
const dbRef = db.ref();

// 4. Listen for data from Firebase
dbRef.on('value', (snapshot) => {
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
    const countries = dbData.countries || {};
    const families = dbData.families || {};

    const groups = {};
    for (const key in countries) {
        const country = countries[key];
        
        // SAFETY CHECK: Skip this loop if the country is null or missing a group
        if (!country || !country.group) continue;

        if (!groups[country.group]) {
            groups[country.group] = [];
        }
        groups[country.group].push(country);
    }

    const sortedGroupNames = Object.keys(groups).sort();

    let familyOptions = '<option value="">-- Select Family --</option>';
    for (const key in families) {
        const family = families[key];
        
        // SAFETY CHECK: Skip if family data is missing
        if (!family || !family.name) continue; 
        
        familyOptions += `<option value="${key}">${family.name}</option>`;
    }

    const draftBoard = document.getElementById('draft-board');
    draftBoard.innerHTML = ''; 
    
    sortedGroupNames.forEach(groupName => {
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

        groups[groupName].forEach(country => {
            // Provide a fallback empty string if a flag URL is missing
            const flag = country.flagUrl || ''; 
            const name = country.name || 'Unknown';

            tableHTML += `
                <tr>
                    <td class="flag-cell">
                        <img src="${flag}" alt="${name} flag" class="flag-img">
                    </td>
                    <td>
                        <span class="country-name">${name}</span>
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
