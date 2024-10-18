// Variable to store API data
let apiData = null;
let stops = [];
let routes = [];
let holidays = [];

// Function to fetch API data
async function fetchAPIData() {
    try {
        const url = new URL('http://127.0.0.1:8000/api/v2/webapp/load');
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            url.searchParams.append('debug', 'true');
        }
        const response = await fetch(url);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching API data:', error);
        return null;
    }
}

// Function to store API data in cache
function storeAPIDataInCache(data) {
    // Store in localStorage
    localStorage.setItem('apiData', JSON.stringify(data));
    
    // Store in cookie that never expires
    document.cookie = `apiData=${JSON.stringify(data)}; path=/; expires=Tue, 19 Jan 2038 03:14:07 GMT`;
}

// Function to retrieve API data from cache
function getAPIDataFromCache() {
    // Try to get from localStorage
    const storedData = localStorage.getItem('apiData');
    if (storedData) {
        return JSON.parse(storedData);
    }

    // If not in localStorage, try to get from cookie
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'apiData') {
            return JSON.parse(decodeURIComponent(value));
        }
    }

    return null;
}

// Function to load API data
async function loadAPIData() {
    // Try to fetch new data
    const newData = await fetchAPIData();
    
    if (newData) {
        // If fetch successful, update apiData and cache
        apiData = newData;
        storeAPIDataInCache(newData);
        console.log('API data fetched and stored successfully');
    } else {
        // If fetch fails, try to load from cache
        const cachedData = getAPIDataFromCache();
        if (cachedData) {
            apiData = cachedData;
            console.log('API data loaded from cache');
        } else {
            console.log('No API data available');
        }
    }
    console.log('apiData', apiData);
    first_element = apiData[0];
    stops = first_element.stops;
    holidays = first_element.holidays;
    routes = apiData.slice(1);
    console.log('stops', stops);
    console.log('holidays', holidays);
    console.log('routes', routes);
}

// Call the function when the script loads
loadAPIData();

// Function to get the current API data
function getAPIData() {
    return apiData;
}

// Function to check if the device is online
function isOnline() {
    return navigator.onLine;
}

// Function to handle online/offline events
function handleConnectivityChange() {
    if (isOnline()) {
        console.log('Device is online. Attempting to fetch fresh API data.');
        loadAPIData();
    } else {
        console.log('Device is offline. Using cached data if available.');
        const cachedData = getAPIDataFromCache();
        if (cachedData) {
            apiData = cachedData;
            console.log('API data loaded from cache');
        } else {
            console.log('No cached API data available');
        }
    }
}

// Add event listeners for online/offline events
window.addEventListener('online', handleConnectivityChange);
window.addEventListener('offline', handleConnectivityChange);

// Initial check on load
handleConnectivityChange();

function getStops() {
    return stops;
}

// Function to get routes based on origin, destination, date, and time
function getRoutes(origin, destination, date, time) {
    // Convert input time to 24-hour format for comparison
    const inputTime = convertTo24Hour(time);
    
    // Get day of the week from the input date
    const inputDate = new Date(date);
    let dayOfWeek;
    
    // Check if the date is a holiday
    const isHoliday = holidays.some(holiday => {
        const holidayDate = new Date(holiday.date);
        return holidayDate.getFullYear() === inputDate.getFullYear() &&
               holidayDate.getMonth() === inputDate.getMonth() &&
               holidayDate.getDate() === inputDate.getDate();
    });

    if (isHoliday) {
        dayOfWeek = 'SUNDAY';
    } else {
        const day = inputDate.getDay();
        if (day === 0) {
            dayOfWeek = 'SUNDAY';
        } else if (day === 6) {
            dayOfWeek = 'SATURDAY';
        } else {
            dayOfWeek = 'WEEKDAY';
        }
    }
    
    // Filter routes based on criteria
    const filteredRoutes = routes.filter(route => {
        // Check if the route includes both origin and destination
        const includesOrigin = route.stops.includes(origin);
        const includesDestination = route.stops.includes(destination);
        
        // Check if origin comes before destination in the route
        const originIndex = route.stops.indexOf(origin);
        const destinationIndex = route.stops.indexOf(destination);
        const correctOrder = originIndex < destinationIndex;
        
        // Check if the route operates on the given day
        const operatesOnDay = route.weekday === dayOfWeek;
        
        // Check if the route's departure time is after the input time
        const routeTime = convertTo24Hour(route.times[originIndex]);
        const isAfterInputTime = routeTime >= inputTime;
        
        return includesOrigin && includesDestination && correctOrder && operatesOnDay && isAfterInputTime;
    });
    
    return filteredRoutes;
}

// Helper function to convert time to 24-hour format
function convertTo24Hour(time) {
    const [hours, minutes] = time.split('h');
    let hour = parseInt(hours);
    if (time.toLowerCase().includes('pm') && hour !== 12) {
        hour += 12;
    }
    return `${hour.toString().padStart(2, '0')}:${minutes}`;
}
