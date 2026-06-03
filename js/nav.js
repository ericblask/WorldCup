// nav.js

const navHTML = `
    <nav class="main-nav">

        <a href="today.html">Today</a> | 
        <a href="schedule.html">Full Schedule</a> | 
        <a href="familystandings.html">Family Standings</a> | 
        <a href="standings.html">Standings</a> | 
        <a href="knockoutsched.html">Knockout Round Schedule</a> |
        <a href="knockoutbracket.html">Knockout Bracket</a> |
    </nav>
`;

// Insert the nav HTML into the placeholder div
document.getElementById('nav-placeholder').innerHTML = navHTML;

// Bonus: Highlight the active page based on the current URL
const currentLocation = location.href;
const navLinks = document.querySelectorAll('.main-nav a');

navLinks.forEach(link => {
    if (link.href === currentLocation) {
        link.classList.add('active'); // You can style this class in your CSS
    }
});
