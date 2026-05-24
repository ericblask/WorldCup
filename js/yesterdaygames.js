import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";
import { getFormattedDate, extractDateFromField } from "./dateUtils.js";

const db = getDatabase();
const d = new Date();
d.setDate(d.getDate() - 1); // Subtract one day
const target = getFormattedDate(d);

onValue(ref(db, 'schedules'), (snapshot) => {
    const matches = Object.values(snapshot.val() || {});
    const yesterdayMatches = matches.filter(m => extractDateFromField(m.date) === target);
    
    console.log("Yesterday's Matches:", yesterdayMatches);
    // Add logic here to render these to your DOM (e.g., container.innerHTML = ...)
});
