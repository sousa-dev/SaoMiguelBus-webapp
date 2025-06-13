// Variable to store API data
let apiData = null;
let stops = [];
let routes = [];
let holidays = [];
let infos = [];

// Function to fetch API data
async function fetchAPIData() {
    try {
        const url = new URL('https://api.saomiguelbus.com/api/v2/webapp/load');
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

function updateAlertBadge() {
    const alertMessages = document.getElementById('alertMessages');
    const alertBadge = document.getElementById('alertBadge');
    if (infos.length > 0) {
        alertBadge.textContent = infos.length;
        alertMessages.classList.remove('hidden');
    } else {
        alertMessages.classList.add('hidden');
    }

    // Update alert content
    const alertContent = document.getElementById('alertContent');
    alertContent.innerHTML = '';
    infos.forEach(info => {
        let title;
        let message;
        
        switch (currentLanguage) {
            case 'pt':
                title = info.titlePT;
                message = info.messagePT;
                break;
            case 'es':
                title = info.titleES;
                message = info.messageES;
                break;
            case 'fr':
                title = info.titleFR;
                message = info.messageFR;
                break;
            case 'de':
                title = info.titleDE;
                message = info.messageDE;
                break;
            case 'it':
                title = info.titleIT || info.titleEN;
                message = info.messageIT || info.messageEN;
                break;
            case 'uk':
                title = info.titleUK || info.titleEN;
                message = info.messageUK || info.messageEN;
                break;
            case 'zh':
                title = info.titleZH || info.titleEN;
                message = info.messageZH || info.messageEN;
                break;
            default:
                title = info.titleEN;
                message = info.messageEN;
                break;

        }

        const source = info.source;
        const company = info.company;
        const alertMessage = document.createElement('div');
        const charactersLimit = 250;
        const truncatedMessage = message.length > charactersLimit ? message.slice(0, charactersLimit) + '...' : message;
        alertMessage.innerHTML = `
            <strong>${title}</strong><br>
            <span class="truncated-message text-xs">${truncatedMessage}</span>
            ${message.length > charactersLimit ? `<button class="show-more-btn text-blue-500 text-xs" data-umami-event="show-more-alert">${t('showMore')}</button>` : ''}<br>
            <div class="full-message text-xs" style="display: none;">
                <span>${message}</span>
                <button class="show-less-btn text-blue-500" data-umami-event="show-less-alert">${t('showLess')}</button>
            </div>
            <div style="display: flex; justify-content: flex-end; align-items: center;">
                <a href="${source}" target="_blank" rel="noopener noreferrer" class="flex text-gray-500" data-umami-event="open-alert-source">
                    <small>${company}</small>
                    <i class="fas fa-external-link-alt ml-1"></i>
                </a>
            </div>
            <hr>
        `;
        if (message.length > charactersLimit) {
            const showMoreBtn = alertMessage.querySelector('.show-more-btn');
            const showLessBtn = alertMessage.querySelector('.show-less-btn');
            const truncatedMsg = alertMessage.querySelector('.truncated-message');
            const fullMsg = alertMessage.querySelector('.full-message');
            showMoreBtn.addEventListener('click', () => {
                truncatedMsg.style.display = 'none';
                fullMsg.style.display = 'block';
                showMoreBtn.style.display = 'none';
            });
            showLessBtn.addEventListener('click', () => {
                truncatedMsg.style.display = 'block';
                fullMsg.style.display = 'none';
                showMoreBtn.style.display = 'block';
            });
        }
        alertContent.appendChild(alertMessage);
    });
}

// Function to load API data
async function loadAPIData() {
    // Try to fetch new data
    const newData = await fetchAPIData();
    
    if (newData) {
        // If fetch successful, update apiData and cache
        apiData = newData;
        storeAPIDataInCache(newData);
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
    infos = first_element.infos;
    routes = apiData.slice(1);

    // Update alert badge
    updateAlertBadge();
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

function toggleVisibilityOffline(isOnline) {
    const offlineElements = document.querySelectorAll('[data-offline="false"]');
    const navDirectionsButton = document.getElementById('navDirectionsButton');
    const visibility = isOnline ? 'block' : 'none';
    offlineElements.forEach(element => {
        element.style.display = visibility;
    });
    if (navDirectionsButton) {
        navDirectionsButton.classList.toggle('hidden', !isOnline);
    }
}

// Function to handle online/offline events
function handleConnectivityChange() {
    if (isOnline()) {
        console.log('Device is online. Attempting to fetch fresh API data.');
        toggleVisibilityOffline(true);
        loadAPIData();
    } else {
        console.log('Device is offline. Using cached data if available.');
        toggleVisibilityOffline(false);
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
            return 'aaaaaeeeeiiiiooooouuuuc'['áàâãäéèêëíìîïóòôõöúùûüç'.indexOf(match)] || match;
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
