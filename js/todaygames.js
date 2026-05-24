import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";
import { getFormattedDate, extractDateFromField } from "./dateUtils.js";

const db = getDatabase();
const target = getFormattedDate(new Date());

onValue(ref(db, 'schedules'), (snapshot) => {
    const matches = Object.values(snapshot.val() || {});
    
    // Filter matches using the new helper
    const todayMatches = matches.filter(m => 
        extractDateFromField(m.date) === target
    );
    
    console.log("Today's Matches:", todayMatches);
});
