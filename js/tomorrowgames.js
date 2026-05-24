import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";
import { getFormattedDate, extractDateFromField } from "./dateUtils.js";

const db = getDatabase();
const d = new Date();
d.setDate(d.getDate() + 1); // Add one day
const target = getFormattedDate(d);

onValue(ref(db, 'schedules'), (snapshot) => {
    const matches = Object.values(snapshot.val() || {});
    const tomorrowMatches = matches.filter(m => extractDateFromField(m.date) === target);
    
    console.log("Tomorrow's Matches:", tomorrowMatches);
});
