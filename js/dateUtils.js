export function getFormattedDate(dateObj) {
    // Converts a Date object to "YYYY-MM-DD"
    return dateObj.toISOString().split('T')[0];
}

export function extractDateFromField(dateString) {
    // If your field is "2026-06-24 22:00:00", 
    // this returns just the "2026-06-24" part.
    return dateString.split(' ')[0];
}
