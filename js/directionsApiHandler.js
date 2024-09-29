// Set up click event listener for btnSubmitStepByStep
document.getElementById('btnSubmitStepByStep').addEventListener('click', function(event) {
    event.preventDefault(); // Prevent form submission

    const parameters = getStepByStepSearchParameters();
    console.log(parameters);
    if (parameters) {
        searchStepByStep(parameters.origin, parameters.destination, parameters.day, parameters.time);
    }
});

function searchStepByStep(origin, destination, day, time) {
    const parameters = getUrlParameters(origin, destination, day, time);
    const url = 'https://saomiguelbus-api.herokuapp.com/api/v1/gmaps?origin=' + encodeURIComponent(parameters.origin) 
    + '&destination=' + encodeURIComponent(parameters.destination) 
    + '&day=' + encodeURIComponent(parameters.day) 
    + '&start=' + encodeURIComponent(parameters.time)
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
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function displayDirections(data) {
    const directionsContainer = document.getElementById('directionsContainer');
    directionsContainer.innerHTML = ''; // Clear previous results

    if (!data.routes || data.routes.length === 0) {
        directionsContainer.innerHTML = '<p class="text-red-500 text-center py-4">No routes found.</p>';
        return;
    }

    data.routes.forEach((route, routeIndex) => {
        const routeCard = document.createElement('div');
        routeCard.className = 'bg-white shadow-md rounded-lg p-6 mb-6';
        routeCard.innerHTML = `<h4 class="text-2xl font-semibold mb-4">Route ${routeIndex + 1}</h4>`;

        const leg = route.legs[0];

        // Create a card for the overall trip
        const tripCard = createTripCard(leg);
        routeCard.appendChild(tripCard);

        // Create cards for each step
        leg.steps.forEach((step, index) => {
            const stepCard = createStepCard(step, index + 1);
            routeCard.appendChild(stepCard);
        });

        directionsContainer.appendChild(routeCard);
    });
}

function createTripCard(leg) {
    const card = document.createElement('div');
    card.className = 'bg-white shadow-md rounded-lg p-6 mb-6';
    card.innerHTML = `
        <h5 class="text-xl font-semibold mb-4">Trip Overview</h5>
        <p class="mb-2"><span class="font-medium">From:</span> ${leg.start_address}</p>
        <p class="mb-2"><span class="font-medium">To:</span> ${leg.end_address}</p>
        <p class="mb-2"><span class="font-medium">Distance:</span> ${leg.distance.text}</p>
        <p class="mb-2"><span class="font-medium">Duration:</span> ${leg.duration.text}</p>
        <p class="mb-2"><span class="font-medium">Departure:</span> ${leg.departure_time.text}</p>
        <p class="mb-2"><span class="font-medium">Arrival:</span> ${leg.arrival_time.text}</p>
    `;
    return card;
}

function createStepCard(step, stepNumber) {
    const card = document.createElement('div');
    card.className = 'bg-white shadow-md rounded-lg p-4 mb-4';
    
    let stepContent = `
        <h6 class="text-lg font-semibold mb-2">Step ${stepNumber}</h6>
        <p class="mb-2">${step.html_instructions}</p>
        <p class="mb-1"><span class="font-medium">Distance:</span> ${step.distance.text}</p>
        <p class="mb-1"><span class="font-medium">Duration:</span> ${step.duration.text}</p>
    `;

    if (step.travel_mode === 'TRANSIT') {
        const transit = step.transit_details;
        stepContent += `
            <p class="mb-1"><span class="font-medium">Transit:</span> ${transit.line.short_name || transit.line.name}</p>
            <p class="mb-1"><span class="font-medium">Departure Stop:</span> ${transit.departure_stop.name}</p>
            <p class="mb-1"><span class="font-medium">Arrival Stop:</span> ${transit.arrival_stop.name}</p>
            <p class="mb-1"><span class="font-medium">Departure Time:</span> ${transit.departure_time.text}</p>
            <p class="mb-1"><span class="font-medium">Arrival Time:</span> ${transit.arrival_time.text}</p>
        `;
    }

    card.innerHTML = stepContent;
    return card;
}

function getStepByStepSearchParameters() {
    console.log("getStepByStepSearchParameters called");
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