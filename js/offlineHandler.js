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
    first_element = apiData[0];
    stops = first_element.stops;
    holidays = first_element.holidays;
    routes = apiData.slice(1);
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
    const originalOrigin = origin;
    const originalDestination = destination;
    const inputTime = time;
    const inputDate = new Date(date);
    let dayOfWeek;
    
    // Convert origin and destination to lowercase and replace special characters
    const replaceSpecialChars = (str) => {
        return str.toLowerCase().replace(/[-áàâãäéèêëíìîïóòôõöúùûüç]/g, match => {
            return 'aaaaaeeeeiiiioooooouuuuc'['áàâãäéèêëíìîïóòôõöúùûüç'.indexOf(match)] || match;
        }).replace(/-/g, '');
    };
    
    origin = replaceSpecialChars(origin);
    destination = replaceSpecialChars(destination);
    
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
    
    // Filter and format routes based on criteria
    const filteredRoutes = routes.filter(route => {
        const includesOrigin = route.stops.map(replaceSpecialChars).includes(origin);
        const includesDestination = route.stops.map(replaceSpecialChars).includes(destination);
        const originIndex = route.stops.map(replaceSpecialChars).indexOf(origin);
        const destinationIndex = route.stops.map(replaceSpecialChars).indexOf(destination);
        const correctOrder = originIndex < destinationIndex;
        const operatesOnDay = route.weekday === dayOfWeek;
        const routeTime = route.times[originIndex];
        const isAfterInputTime = routeTime >= inputTime;
        
        return includesOrigin && includesDestination && correctOrder && operatesOnDay && isAfterInputTime;
    }).map(route => {
        const originIndex = route.stops.map(replaceSpecialChars).indexOf(origin);
        const destinationIndex = route.stops.map(replaceSpecialChars).indexOf(destination);
        const stopsObj = {};
        for (let i = originIndex; i <= destinationIndex; i++) {
            stopsObj[replaceSpecialChars(route.stops[i])] = route.times[i];
        }
        
        return {
            id: route.id,
            route: 'C' + route.route,
            origin: originalOrigin,
            destination: originalDestination,
            start: route.times[originIndex],
            end: route.times[destinationIndex],
            stops: JSON.stringify(stopsObj).replace(/"/g, "'"),
            type_of_day: dayOfWeek,
            information: route.information || 'None',
            likes_percent: route.likes_percent || 0,
            dislikes_percent: route.dislikes_percent || 0
        };
    });
    
    return filteredRoutes;
}
