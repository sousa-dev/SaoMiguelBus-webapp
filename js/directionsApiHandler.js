/**
 * Decodes a polyline string into an array of [latitude, longitude] pairs.
 * @param {string} polyline - The encoded polyline string.
 * @returns {Array} - An array of [latitude, longitude] pairs.
 */
function decodePolyline(polyline) {
    let index = 0, len = polyline.length;
    const lat = 0, lng = 0;
    const coordinates = [];
    let shift = 0, result = 0, byte = null;
    let currentLat = 0, currentLng = 0;

    while (index < len) {
        // Decode latitude
        shift = 0;
        result = 0;
        do {
            byte = polyline.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);
        const deltaLat = (result & 1) ? ~(result >> 1) : (result >> 1);
        currentLat += deltaLat;

        // Decode longitude
        shift = 0;
        result = 0;
        do {
            byte = polyline.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);
        const deltaLng = (result & 1) ? ~(result >> 1) : (result >> 1);
        currentLng += deltaLng;

        coordinates.push([currentLat / 1e5, currentLng / 1e5]);
    }

    return coordinates;
}

/**
 * Redirects to the Step By Step Directions page and populates form values.
 */
function redirectToStepByStepDirections() {
    const origin = document.getElementById('origin').value;
    const destination = document.getElementById('destination').value;
    const date = document.getElementById('datePicker').value;
    const time = document.getElementById('time').value;

    // Switch to the Directions page
    showPage('routes');

    // Update the form values on the Directions page
    document.getElementById('originStepByStep').value = origin;
    document.getElementById('destinationStepByStep').value = destination;
    document.getElementById('datePickerStepByStep').value = date;
    document.getElementById('timeStepByStep').value = time;
}

/**
 * Sets up event listeners for form submission.
 */
document.getElementById('btnSubmitStepByStep').addEventListener('click', function(event) {
    event.preventDefault(); // Prevent form submission

    const parameters = getStepByStepSearchParameters();
    if (parameters) {
        searchStepByStep(parameters.origin, parameters.destination, parameters.day, parameters.time);
    }
});

/**
 * Initiates a Step By Step search with the provided parameters.
 * @param {string} origin - The origin location.
 * @param {string} destination - The destination location.
 * @param {string} day - The day type.
 * @param {string} time - The time.
 */
function searchStepByStep(origin, destination, day, time) {
    showLoadingSpinner();
    loadAdBanner('home');
    const parameters = getUrlParametersStepByStep(origin, destination, day, time);
    const languageCode = getCookie('language') || (['pt', 'en', 'es'].includes(navigator.language.split('-')[0]) ? navigator.language.split('-')[0] : 'pt');
    if (languageCode === 'pt') {
        currentLanguage = 'pt-pt';
    }

    const url = 'https://api.saomiguelbus.com/api/v1/gmaps?origin=' + encodeURIComponent(parameters.origin) 
    + '&destination=' + encodeURIComponent(parameters.destination) 
    + '&day=' + encodeURIComponent(parameters.day) 
    + '&start=' + encodeURIComponent(parameters.time)
    + '&languageCode=' + currentLanguage
    + '&key=' + 'SMBFj56xBCLc986j6odk3AK6fJa95k'
    + '&version=' + '5.0';
    fetchGMaps(url);

    if (window.location.hostname != "localhost" && window.location.hostname != "127.0.0.1")
        postToStatsStepByStep(parameters);
}

function postToStatsStepByStep(parameters) {
    const url = `https://api.saomiguelbus.com/api/v1/stat?request=get_directions&origin=${encodeURIComponent(parameters.origin)}&destination=${encodeURIComponent(parameters.destination)}&time=${encodeURIComponent(parameters.time)}&language=${encodeURIComponent(currentLanguage)}&platform=web&day=${encodeURIComponent(parameters.day)}`;
    fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',  // Ensure CORS mode is enabled
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

/**
 * Fetches directions data from the API.
 * @param {string} url - The API endpoint URL.
 */
function fetchGMaps(url) {
    fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',  // Ensure CORS mode is enabled
    })
    .then(response => response.json())
    .then(data => {
        displayDirections(data);
        hideLoadingSpinner();
    })
    .catch(error => {
        console.error('Error:', error);
        hideLoadingSpinner();
    });
}

/**
 * Displays the fetched directions in styled StepByStep cards.
 * @param {Object} data - The directions data from the API.
 */
function displayDirections(data) {
    const directionsContainer = document.getElementById('directionsContainer');
    directionsContainer.innerHTML = ''; // Clear previous results

    const userInputOrigin = document.getElementById('originStepByStep').value;
    const userInputDestination = document.getElementById('destinationStepByStep').value;
    if (!data.routes || data.routes.length === 0) {
        const noRoutesDiv = document.createElement('div');
        noRoutesDiv.className = 'container mx-auto px-4 mt-4';
        noRoutesDiv.innerHTML = `
            <div class="bg-red-100 shadow-md rounded-lg p-6">
                <div class="flex flex-col items-center">
                    <h3 class="text-xl font-semibold mb-2 text-center">
                        ${t('noRoutesMessage').replace('{origin}', userInputOrigin).replace('{destination}', userInputDestination)}
                    </h3>
                    <p class="text-gray-600 text-center">${t('noRoutesSubtitle')}</p>
                </div>
            </div>
        `;
        directionsContainer.appendChild(noRoutesDiv);
        return;
    }

    // Create cards for each route
    data.routes.forEach((route, index) => {
        const routeCard = createRouteCard(route, index);
        directionsContainer.appendChild(routeCard);
    });
}

/**
 * Creates a styled Route Card for each route.
 * @param {Object} route - The route data.
 * @param {number} index - The index of the route.
 * @returns {HTMLElement} - The styled Route Card element.
 */
function createRouteCard(route, index) {
    const card = document.createElement('div');
    card.className = 'bg-white mb-4 shadow-md rounded-lg overflow-hidden';

    const leg = route.legs[0];

    const walkDistance = leg.steps.filter(step => step.travel_mode === 'WALKING').reduce((total, step) => total + step.distance.value, 0);
    const busDistance = leg.steps.filter(step => step.travel_mode === 'TRANSIT').reduce((total, step) => total + step.distance.value, 0);

    const formattedWalkDistance = walkDistance < 1000 ? `${walkDistance} m` : `${(walkDistance / 1000).toFixed(1)} km`;
    const formattedBusDistance = busDistance < 1000 ? `${busDistance} m` : `${(busDistance / 1000).toFixed(1)} km`;

    const nTransfers = leg.steps.filter(step => step.travel_mode === 'TRANSIT').length - 1;

    const header = document.createElement('div');
    header.className = 'p-4 cursor-pointer';
    header.innerHTML = `
        <div class="flex items-center justify-center mb-2 mt-4">
            <div class="flex items-center justify-start flex-1">
                <i class="fas fa-route text-green-600 mr-1"></i>
            </div>
            <div class="flex items-center justify-center flex-1">
                <i class="fas fa-walking text-green-600 mr-1"></i>
                <span class="text-gray-600">${formattedWalkDistance}</span>
            </div>
            <div class="flex items-center justify-end flex-1">
                <i class="fas fa-bus text-green-600 mr-1"></i>
                <span class="text-gray-600">${formattedBusDistance}</span>
            </div>
        </div>
        <div class="stops-summary flex flex-col">
            <div class="time-line flex items-center justify-between mb-2">
                <div class="time text-2xl font-bold text-center w-1/4">${leg.departure_time.text}</div>
                <div class="route-line flex-grow mx-4 relative">
                    <div class="absolute inset-0 flex items-center">
                        <div class="h-0.5 w-full bg-gray-300 relative dashed-line">
                            <div class="absolute inset-0 flex flex-col items-center justify-center">
                                <span class="bg-white px-2 text-sm font-medium text-gray-500 travel-time rounded border">
                                    ${leg.duration.text}
                                </span>
                            </div>
                            ${nTransfers > 0 ? `
                                <span class="bg-white px-2 text-xs font-medium text-gray-500 mt-4 flex items-center justify-center">
                                    <i class="fa fa-shuffle mr-1"></i> ${nTransfers} ${nTransfers === 1 ? t('transfer') : t('transfers')}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                </div>
                <div class="time text-2xl font-bold text-center w-1/4">${leg.arrival_time.text}</div>
            </div>
            <div class="stops flex justify-between">
                <div class="start-stop w-1/4 pr-2">
                    <div class="location text-center">
                        <div class="text-base">${leg.start_address.split(',')[0]}</div>
                        <div class="text-sm text-gray-600">${leg.start_address.split(',').slice(1).join(',').trim().replace('Portugal', '')}</div>
                    </div>
                </div>
                <div class="end-stop w-1/4 pl-2">
                    <div class="location text-center">
                        <div class="text-base">${leg.end_address.split(',')[0]}</div>
                        <div class="text-sm text-gray-600">${leg.end_address.split(',').slice(1).join(',').trim().replace('Portugal', '')}</div>
                    </div>
                </div>
            </div>
            <div class="mt-4 text-center">
                <button class="expand-stops flex items-center justify-center w-full text-blue-500 hover:text-blue-700 text-base py-2">
                    <span class="mr-2">${t('clickToSeeDetails')}</span>
                    <span class="iconify transform transition-transform duration-300 text-xl" data-icon="mdi:chevron-down"></span>
                </button>
            </div>
        </div>
    `;

    const detailsContainer = document.createElement('div');
    detailsContainer.className = 'hidden';

    leg.steps.forEach((step, stepIndex) => {
        const stepCard = createStepCard(step, stepIndex + 1);
        detailsContainer.appendChild(stepCard);
    });

     // Create a single map container for the entire route
     const mapContainer = document.createElement('div');
     // Create a legend container
     const legendContainer = document.createElement('div');
     legendContainer.className = 'legend bg-white p-2 rounded shadow-md';
     legendContainer.style.position = 'absolute';
     legendContainer.style.bottom = '10px';
     legendContainer.style.right = '10px';
     legendContainer.style.zIndex = '1000';

     // Add legend items
     const legendItems = [
         { icon: 'fa-square', color: 'red', label: t('walking') },
         { icon: 'fa-square', color: 'blue', label: t('transit') },
         { icon: 'fa-play-circle', color: 'green', label: t('start') },
         { icon: 'fa-stop-circle', color: 'red', label: t('end') }
     ];

     legendItems.forEach(item => {
         const itemDiv = document.createElement('div');
         itemDiv.className = 'flex items-center mb-1';
         itemDiv.innerHTML = `
             <i class="fas ${item.icon} mr-2" style="color: ${item.color};"></i>
             <span class="text-sm">${item.label}</span>
         `;
         legendContainer.appendChild(itemDiv);
     });

     // Append legend to map container
     mapContainer.appendChild(legendContainer);
     mapContainer.id = `route-map-${leg.start_address}-${leg.end_address}`.replace(/\s+/g, '-');
     mapContainer.style.height = '300px';
     detailsContainer.appendChild(mapContainer);
 
     // Initialize the map after a short delay to ensure the container is fully rendered
     setTimeout(() => {
         const map = L.map(mapContainer).setView([37.777903731799725, -25.500576189450747], 9);
 
         // Add OpenStreetMap tile layer
         L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
             attribution: '© OpenStreetMap contributors'
         }).addTo(map);
 
         // Initialize layer groups for walking and transit
         const walkingLayer = L.layerGroup().addTo(map);
         const transitLayer = L.layerGroup().addTo(map);
 
         // Iterate through each step to draw polylines with different colors and add icons
         leg.steps.forEach((step) => {
             if (step.travel_mode === 'WALKING' && step.polyline && step.polyline.points) {
                 const walkLatLngs = decodePolyline(step.polyline.points);
                 L.polyline(walkLatLngs, { color: 'red', weight: 5 }).addTo(walkingLayer);
                 
                 // Add walking icon at the start of the walking step
                 L.marker(walkLatLngs[0], {
                     icon: L.divIcon({
                         html: '<i class="fas fa-walking text-green-500 text-2xl"></i>',
                         className: 'custom-div-icon',
                         iconSize: [24, 24],
                         iconAnchor: [12, 12]
                     })
                 }).addTo(map);
             } else if (step.travel_mode === 'TRANSIT' && step.polyline && step.polyline.points) {
                 const transitLatLngs = decodePolyline(step.polyline.points);
                 L.polyline(transitLatLngs, { color: 'blue', weight: 5 }).addTo(transitLayer);
                 
                 // Add bus icon at the start of the transit step
                 L.marker(transitLatLngs[0], {
                     icon: L.divIcon({
                         html: '<i class="fas fa-bus text-green-500 text-2xl"></i>',
                         className: 'custom-div-icon',
                         iconSize: [24, 24],
                         iconAnchor: [12, 12]
                     })
                 }).addTo(map);
             }
         });
 
         // Add markers for start and end points
         const startPoint = decodePolyline(route.overview_polyline.points)[0];
         const endPoint = decodePolyline(route.overview_polyline.points).slice(-1)[0];
 
         L.marker([startPoint[0], startPoint[1] + 0.0001], {
             icon: L.divIcon({
                 html: '<i class="fas fa-play-circle text-green-300 text-xl"></i>',
                 className: 'custom-div-icon',
                 iconSize: [32, 32],
                 iconAnchor: [16, 16]
             })
         }).addTo(map)
             .bindPopup(leg.start_address.split(',')[0])
             .openPopup();
 
         L.marker(endPoint, {
             icon: L.divIcon({
                 html: '<i class="fas fa-stop-circle text-red-500 text-xl"></i>',
                 className: 'custom-div-icon',
                 iconSize: [32, 32],
                 iconAnchor: [16, 16]
             })
         }).addTo(map)
             .bindPopup(leg.end_address.split(',')[0]);
 
         // Force a resize of the map to ensure it renders correctly
         map.invalidateSize();
     }, 0);

    card.appendChild(header);
    card.appendChild(detailsContainer);

    // Add click event to toggle details
    header.addEventListener('click', () => {
        detailsContainer.classList.toggle('hidden');
        header.querySelector('.iconify').classList.toggle('mdi:chevron-up');
        header.querySelector('.iconify').classList.toggle('mdi:chevron-down');
    });

    // Add click event to expand/collapse route details
    card.addEventListener('click', function(event) {
        // Prevent the click event from triggering on buttons inside the card
        if (event.target.tagName === 'BUTTON' || event.target.closest('button')) {
            return;
        }
        
        toggleStepByStepDetails(this);
    });

    // Add click event to the expand button
    const expandButton = card.querySelector('.expand-stops');
    expandButton.addEventListener('click', function(event) {
        toggleStepByStepDetails(card);
    });

    return card;
}

/**
 * Toggles the visibility of the step details.
 * @param {HTMLElement} card - The card element.
 */
function toggleStepByStepDetails(card) {
    const detailsContainer = card.querySelector('.details-container');
    const expandButton = card.querySelector('.expand-stops');
    const icon = expandButton.querySelector('.iconify');

    detailsContainer.classList.toggle('hidden');
    icon.classList.toggle('rotate-180');

    // Smooth transition for expanding/collapsing
    if (detailsContainer.classList.contains('hidden')) {
        detailsContainer.style.maxHeight = '0px';
    } else {
        detailsContainer.style.maxHeight = detailsContainer.scrollHeight + 'px';
    }
}


/**
 * Creates a styled Step Card for each step in the directions.
 * @param {Object} step - The step data.
 * @param {number} stepNumber - The step number.
 * @returns {HTMLElement} - The styled Step Card element.
 */
function createStepCard(step, stepNumber) {
    const card = document.createElement('div');
    card.className = 'p-4 border-t border-gray-200 bg-gray-50 details-container';

    let icon = 'mdi:bus';
    if (step.travel_mode === 'WALKING') {
        icon = 'mdi:walk';
    }

    const stepContent = `
        <div class="flex items-start">
            <span class="iconify text-3xl mr-4 text-green-500" data-icon="${icon}"></span>
            <div class="flex-grow">
                <h3 class="font-bold text-lg text-green-700">${step.html_instructions}</h3>
                <p class="text-gray-700 mt-1">
                    <span class="font-medium">${step.duration.text}</span>
                    <span class="text-gray-500 ml-4">${step.distance.text}</span>
                </p>
            </div>
            <span class="text-green-600 font-bold font-xl ml-12">${getArrivalTime(step)}</span>
        </div>
    `;

    if (step.travel_mode === 'TRANSIT') {
        const transit = step.transit_details;
        card.innerHTML = `
            ${stepContent}
            <div class="ml-10 mt-2 bg-white rounded-lg shadow-sm p-3">
                <p class="text-gray-700 flex items-center mb-2">
                    <span class="iconify mr-2 text-green-500" data-icon="mdi:bus-stop"></span>
                    <span class="font-medium">${t('departFrom')}</span>
                    <span class="ml-2 text-black font-semibold">${transit.departure_stop.name}</span>
                </p>
                <p class="text-gray-700 flex items-center">
                    <span class="iconify mr-2 text-red-500" data-icon="mdi:bus-stop"></span>
                    <span class="font-medium">${t('arriveAt')}</span>
                    <span class="ml-2 text-black font-semibold">${transit.arrival_stop.name}</span>
                </p>
            </div>
            `;
    } else {
        card.innerHTML = stepContent;
    }

    return card;
}

/**
 * Retrieves the arrival time for a step.
 * @param {Object} step - The step data.
 * @returns {string} - The arrival time text.
 */
function getArrivalTime(step) {
    if (step.travel_mode === 'TRANSIT') {
        return step.transit_details.arrival_time.text;
    }
    // For non-transit steps, you might need to calculate this based on the departure time and duration
    // This is a placeholder and might need adjustment
    return '';
}

/**
 * Retrieves and validates search parameters from the StepByStep form.
 * @returns {Object|null} - The search parameters or null if validation fails.
 */
function getStepByStepSearchParameters() {
    const originInput = document.getElementById('originStepByStep');
    const destinationInput = document.getElementById('destinationStepByStep');
    const day = checkDayType("datePickerStepByStep");
    const time = document.getElementById('timeStepByStep').value;

    // Remove any existing error messages
    originInput.setCustomValidity('');
    destinationInput.setCustomValidity('');

    // Check if origin or destination is empty
    if (!originInput.value) {
        originInput.setCustomValidity(t('originRequired')); // Use translation function
        originInput.reportValidity();
        return null;
    }
    if (!destinationInput.value) {
        destinationInput.setCustomValidity(t('destinationRequired')); // Use translation function
        destinationInput.reportValidity();
        return null;
    }

    return {
        origin: originInput.value,
        destination: destinationInput.value,
        day: day,
        time: time
    };
}

/**
 * Formats URL parameters for API requests.
 * @param {string} origin - The origin location.
 * @param {string} destination - The destination location.
 * @param {string} day - The day type.
 * @param {string} time - The time.
 * @returns {Object} - The formatted URL parameters.
 */
function getUrlParametersStepByStep(origin, destination, day, time) {
    const parameters = {
        'origin': origin,
        'destination': destination,
        'day': day.toUpperCase(),
        'time': time
    };
    //00:00 -> 00h00
    parameters.time = parameters.time.replace(':', 'h');

    // TODO: format the origin and destination strings to remove spaces and special characters

    return parameters;
}
