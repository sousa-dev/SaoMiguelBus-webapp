function redirectToStepByStepDirections() {
    console.log('redirectToStepByStepDirections');
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

// Set up click event listener for btnSubmitStepByStep
document.getElementById('btnSubmitStepByStep').addEventListener('click', function(event) {
    event.preventDefault(); // Prevent form submission

    const parameters = getStepByStepSearchParameters();
    if (parameters) {
        searchStepByStep(parameters.origin, parameters.destination, parameters.day, parameters.time);
    }
});

function searchStepByStep(origin, destination, day, time) {
    showLoadingSpinner();
    const parameters = getUrlParameters(origin, destination, day, time);
    const languageCode = getCookie('language') || (['pt', 'en', 'es'].includes(navigator.language.split('-')[0]) ? navigator.language.split('-')[0] : 'pt');
    if (languageCode === 'pt') {
        currentLanguage = 'pt-pt';
    }
    const url = 'https://saomiguelbus-api.herokuapp.com/api/v1/gmaps?origin=' + encodeURIComponent(parameters.origin) 
    + '&destination=' + encodeURIComponent(parameters.destination) 
    + '&day=' + encodeURIComponent(parameters.day) 
    + '&start=' + encodeURIComponent(parameters.time)
    + '&languageCode=' + currentLanguage
    + '&key=' + 'SMBFj56xBCLc986j6odk3AK6fJa95k'
    + '&version=' + '5.0';
    fetchGMaps(url);
}

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

function displayDirections(data) {
    const directionsContainer = document.getElementById('directionsContainer');
    directionsContainer.innerHTML = ''; // Clear previous results

    if (!data.routes || data.routes.length === 0) {
        directionsContainer.innerHTML = '<p class="text-red-500 text-center py-4">No routes found.</p>';
        return;
    }

    // Create cards for each route
    data.routes.forEach((route, index) => {
        const routeCard = createRouteCard(route, index);
        directionsContainer.appendChild(routeCard);
    });
}

function createRouteCard(route, index) {
    const card = document.createElement('div');
    card.className = 'bg-white mb-4 shadow-md rounded-lg overflow-hidden';
    
    const leg = route.legs[0];
    
    const header = document.createElement('div');
    header.className = 'p-4 cursor-pointer';
    header.innerHTML = `
        <div class="flex items-center justify-between mb-2">
            <h2 class="text-xl font-semibold">${leg.start_address}</h2>
            <span class="iconify text-green-600" data-icon="mdi:crosshairs-gps"></span>
        </div>
        <div class="flex items-center justify-between mb-2">
            <h2 class="text-xl font-semibold">${leg.end_address}</h2>
        </div>
        <div class="flex items-center justify-between text-gray-600">
            <span>Partir às ${leg.departure_time.text}</span>
            <span>Chegar às ${leg.arrival_time.text}</span>
        </div>
    `;

    const detailsContainer = document.createElement('div');
    detailsContainer.className = 'hidden';

    leg.steps.forEach((step, stepIndex) => {
        const stepCard = createStepCard(step, stepIndex + 1);
        detailsContainer.appendChild(stepCard);
    });

    card.appendChild(header);
    card.appendChild(detailsContainer);

    // Add click event to toggle details
    header.addEventListener('click', () => {
        detailsContainer.classList.toggle('hidden');
    });

    return card;
}

function createStepCard(step, stepNumber) {
    const card = document.createElement('div');
    card.className = 'p-4 border-t border-gray-200';
    
    let icon = 'mdi:bus';
    let alertIcon = '';
    if (step.travel_mode === 'WALKING') {
        icon = 'mdi:walk';
    }

    let stepContent = `
        <div class="flex items-start">
            <span class="iconify text-3xl mr-4" data-icon="${icon}"></span>
            <div class="flex-grow">
                <h3 class="font-semibold">${step.html_instructions}${alertIcon}</h3>
                <p class="text-gray-600">${step.duration.text}</p>
            </div>
            <span class="text-gray-600">${getArrivalTime(step)}</span>
        </div>
    `;

    if (step.travel_mode === 'TRANSIT') {
        const transit = step.transit_details;
        stepContent += `
            <div class="ml-10 mt-2">
                <p class="text-gray-600">Sair em ${transit.arrival_stop.name}</p>
            </div>
        `;
    }

    card.innerHTML = stepContent;
    return card;
}

function getArrivalTime(step) {
    if (step.travel_mode === 'TRANSIT') {
        return step.transit_details.arrival_time.text;
    }
    // For non-transit steps, you might need to calculate this based on the departure time and duration
    // This is a placeholder and might need adjustment
    return '';
}

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
        return;
    }
    if (!destinationInput.value) {
        destinationInput.setCustomValidity(t('destinationRequired')); // Use translation function
        destinationInput.reportValidity();
        return;
    }

    return {
        origin: originInput.value,
        destination: destinationInput.value,
        day: day,
        time: time
    };
}