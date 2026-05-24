export function isMatchDate(matchDateString, targetDate) {
    // Extract only the date part: "2026-06-24"
    const matchDate = matchDateString.split('T')[0];
    const targetDateString = targetDate.toISOString().split('T')[0];
    return matchDate === targetDateString;
}
