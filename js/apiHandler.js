document.addEventListener("DOMContentLoaded", function() {
    fetchAndPopulateStops();
    const searchBtn = document.getElementById('btnSubmit')
    searchBtn.addEventListener('click', function(event) {
        event.preventDefault();  // Prevents the default form submission action

        const originInput = document.getElementById('origin');
        const destinationInput = document.getElementById('destination');
        const day = checkDayType();
        const time = document.getElementById('time').value;

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

        // Call your function here, passing the origin and destination
        searchRoutes(originInput.value, destinationInput.value, day, time);
    });
    loadAdBanner('home');
});

function fetchAndPopulateStops() {
    const url = 'https://saomiguelbus-api.herokuapp.com/api/v1/stops';
    fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',  // Ensure CORS mode is enabled
    }).then(response => response.json())
        .then(data => {
            const stopsList = data; // Adjust this according to the actual API response structure
            const originDatalist = document.getElementById('origin-stops');
            const destinationDatalist = document.getElementById('destination-stops');

            stopsList.forEach(stop => {
                const optionOrigin = document.createElement('option');
                optionOrigin.value = stop['name'];
                originDatalist.appendChild(optionOrigin);

                const optionDestination = document.createElement('option');
                optionDestination.value = stop['name']; 
                destinationDatalist.appendChild(optionDestination);
            });
        })
        .catch(error => {
            console.error('Error fetching stops:', error);
        });
}

function searchRoutes(origin, destination, day, time) {
    // Hide the routes container and the no routes message
    document.getElementById('routesContainer').style.display = 'none';
    document.getElementById('noRoutesMessage').style.display = 'none';

    const parameters = getUrlParameters(origin, destination, day, time);
    const url = 'https://saomiguelbus-api.herokuapp.com/api/v1/route?origin=' + encodeURIComponent(parameters.origin) 
    + '&destination=' + encodeURIComponent(parameters.destination) 
    + '&day=' + encodeURIComponent(parameters.day) 
    + '&start=' + encodeURIComponent(parameters.time);
    fetchAndDisplayRoutes(url, parameters);
    // postToStats if not in localhost 
    if (window.location.hostname != "localhost" && window.location.hostname != "127.0.0.1")
        postToStats(parameters);
    loadAdBanner('home');
}

function fetchAndDisplayRoutes(url, parameters) {
    fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',  // Ensure CORS mode is enabled
    })
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                displayRoutes(data, parameters.origin);
            } else {
                displayNoRoutesMessage(parameters);
            }
            document.getElementById('placeHolderForAd').scrollIntoView({ behavior: 'smooth' });
        })
        .catch(error => console.error('Error fetching routes:', error));
}

function postToStats(parameters) {
    const url = `https://saomiguelbus-api.herokuapp.com/api/v1/stat?request=get_route&origin=${encodeURIComponent(parameters.origin)}&destination=${encodeURIComponent(parameters.destination)}&time=${encodeURIComponent(parameters.time)}&language=${encodeURIComponent(currentLanguage)}&platform=web&day=${encodeURIComponent(parameters.day)}`;
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

function displayNoRoutesMessage(parameters) {
    const noRoutesDiv = document.getElementById('noRoutesMessage');
    const message = t('noRoutesMessage').replace('{origin}', parameters.origin).replace('{destination}', parameters.destination);
    noRoutesDiv.innerHTML = `
        <div class="container mx-auto px-4 mt-4">
            <div class="bg-red-100 shadow-md rounded-lg p-6">
                <div class="flex flex-col items-center">
                    <h3 class="text-xl font-semibold mb-2 text-center">
                        ${message}
                    </h3>
                    <p class="text-gray-600 text-center">${t('noRoutesSubtitle')}</p>
                </div>
            </div>
        </div>
    `;
    noRoutesDiv.style.display = 'block';
}

function displayRoutes(routes, originStop) {
    const routesContainer = document.getElementById('routesContainer');
    routesContainer.innerHTML = ''; // Clear previous content

    // Sort routes by origin time
    routes.sort((a, b) => {
        const aStopsObj = stringToJSON(a.stops);
        const bStopsObj = stringToJSON(b.stops);

        const aTime = aStopsObj.hasOwnProperty(originStop) ? aStopsObj[originStop] : aStopsObj[Object.keys(aStopsObj)[0]];
        const bTime = bStopsObj.hasOwnProperty(originStop) ? bStopsObj[originStop] : bStopsObj[Object.keys(bStopsObj)[0]];
        return aTime.localeCompare(bTime);
    });

    routes.forEach(route => {
        let ignoreRoute = false;
        const routeDiv = document.createElement('div');
        routeDiv.className = 'container card w-100 center';
        routeDiv.style.cssText = 'margin-top: 30px; border-radius: 8px; padding: 10px; cursor: pointer;';
    
        // Parse the string to a JavaScript object
        const stopsObj = stringToJSON(route.stops);
        const prepositions = ['de', 'da', 'do', 'dos', 'das'];

        originStop = originStop.split(' ').map(word => prepositions.includes(word.toLowerCase()) ? word : word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        const destinationStop = route.destination.split(' ').map(word => prepositions.includes(word.toLowerCase()) ? word : word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

        // Filter stops to only include stops between the origin and destination
        let stops = {};
        let foundOrigin = false;
        let foundDestination = false;
        for (const [stop, time] of Object.entries(stopsObj)) {
            if (stop === originStop) {
                foundOrigin = true;
            }
            if (foundOrigin) {
                stops[stop] = time;
            }
            if (stop === destinationStop) {
                if (!foundOrigin) {
                    ignoreRoute = true;
                    continue;
                }
                foundDestination = true;
                break;
            }
        }

        if (!foundOrigin || !foundDestination || ignoreRoute) {
            return;
        }

        const stopsArray = Object.entries(stops);   
    
        // Get the first and last stops
        const firstStop = stopsArray[0];
        const lastStop = stopsArray[stopsArray.length - 1];
    
        // Generate HTML for the first and last stops and transfer information
        let stopsHtml = `
            <div class="stop text-lg font-bold mb-2">${firstStop[0]}: ${firstStop[1]}</div>
            <div class="transfer flex items-center mb-2" id="transfer-info">
                <span class="arrow-icon text-green-500 mr-2"><i class="fas fa-arrow-down"></i></span> 
                ${stopsArray.length > 2 ? `<span class="transfer-info text-sm text-gray-600">+${stopsArray.length - 2} ${stopsArray.length - 2 === 1 ? t('transfer') : t('transfers')}</span>` : ''} 
            </div>
            <div class="intermediate-stops max-h-0 overflow-hidden transition-max-height duration-500 ease-out">
                ${stopsArray.slice(1, stopsArray.length - 1).map(([stop, time]) => `<div class="stop ml-4 text-base text-gray-700 mb-1">${stop}: ${time}</div>`).join('')}
            </div>
            <div class="stop text-lg font-bold mt-2">${lastStop[0]}: ${lastStop[1]}</div>
        `;
    
        routeDiv.innerHTML = `
            <div class="bg-white shadow-md rounded-lg p-4 hover:shadow-lg transition-shadow duration-300">
                <div class="route-header flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                    <div class="flex items-center">
                        <div class="route-icon text-2xl mr-2"><i class="fas fa-bus"></i></div>
                        <div class="route-number text-xl font-semibold text-green-600">${route.route}</div>
                    </div>
                    <div class="total-time flex items-center">
                        <span class="text-gray-500 mr-1"><i class="far fa-clock"></i></span>
                        <span class="text-lg font-medium">${calculateTotalTravelTime(firstStop[1], lastStop[1])}</span>
                    </div>
                </div>
                <div class="stops-summary">
                    ${stopsHtml}
                </div>
            </div>
        `;
    
        const intermediateStops = routeDiv.querySelector('.intermediate-stops');
        const transferInfo = routeDiv.querySelector('#transfer-info');
        routeDiv.addEventListener('click', function() {
            if (intermediateStops.style.maxHeight === '0px' || !intermediateStops.style.maxHeight) {
                intermediateStops.style.maxHeight = intermediateStops.scrollHeight + 'px';
                transferInfo.style.display = 'none';
            } else {
                intermediateStops.style.maxHeight = '0px';
                transferInfo.style.display = 'block';
            }
        });
    
        routesContainer.appendChild(routeDiv);
    });
    
    routesContainer.style.display = 'block';
    
    // Helper function to calculate total travel time
    function calculateTotalTravelTime(firstStopTime, lastStopTime) {
        const firstTime = firstStopTime.split('h');
        const lastTime = lastStopTime.split('h');
        const firstDate = new Date(0, 0, 0, firstTime[0], firstTime[1], 0);
        const lastDate = new Date(0, 0, 0, lastTime[0], lastTime[1], 0);
        let diff = lastDate.getTime() - firstDate.getTime();
        let hours = Math.floor(diff / 1000 / 60 / 60);
        diff -= hours * 1000 * 60 * 60;
        let minutes = Math.floor(diff / 1000 / 60);
    
        return `${hours > 0 ? `${hours < 10 ? '0' + hours : hours}h${minutes < 10 ? '0' + minutes : minutes}` : `${minutes} min`}`;    
    }
}

function loadAdBanner(on) {
    const apiUrl = `https://saomiguelbus-api.herokuapp.com/api/v1/ad?on=${on}&platform=web`;  // Replace with your API endpoint

    fetch(apiUrl)
        .then(response => response.json())
        .then(ad => {
            if (ad) {
                let hrefValue;
                if (ad.action === 'directions') {
                    hrefValue = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(ad.target)}`; // Directions URL
                } else {
                    hrefValue = ad.target;
                }
                // Assuming ad object has properties like 'target', 'media', 'entity', 'id'
                const adBannerHTML = `
                    <div class="container mx-auto" id="tm-section-2">
                        <div class="flex justify-center">
                            <div class="w-full sm:w-2/3 md:w-1/2 lg:w-1/2">
                                <div class="ad-banner text-center p-2 relative">
                                    <span class="absolute top-0 left-0 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-tl-lg rounded-br-lg z-10">AD</span>
                                    <a href="${hrefValue}" target="_blank" id='ad-clickable'>
                                        <img src="${ad.media}" alt="${ad.entity}" class="w-full h-auto rounded-lg" id="ad-image" data-id="${ad.id}">
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>`;

                // Insert the ad banner into the DOM
                document.getElementById('placeHolderForAd').innerHTML = adBannerHTML;

                // After inserting the ad banner into the DOM
                const adImage = document.getElementById("ad-image");
                if (adImage) {
                    document.getElementById('ad-clickable').addEventListener('click', function(event) {
                        const adId = adImage.getAttribute("data-id");
                        const URL = "https://saomiguelbus-api.herokuapp.com/api/v1/ad/click?id="+ encodeURIComponent(adId);
                        fetch(URL, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            mode: 'cors',
                        })
                        .then(response => response.json())
                        .then(data => console.log(data))
                        .catch(error => console.error(error));
                    });
                }
            }
        })
        .catch(error => console.error('Error loading ad banner:', error));
}

function stringToJSON(string) {
    const validJsonString = string.replace(/'/g, '"');
    // Parse the string to a JavaScript object
    const jsonObj = JSON.parse(validJsonString);
    return jsonObj;
}

function getUrlParameters(origin, destination, day, time) {
    const parameters = {
        'origin': origin,
        'destination': destination,
        'day': day,
        'time': time
    };
    // 1 -> weekday, 2 -> saturday, 3 -> sunday
    parameters.day = parameters.day == 1 ? 'WEEKDAY' : parameters.day == 2 ? 'SATURDAY' : 'SUNDAY';
    //00:00 -> 00h00
    parameters.time = parameters.time.replace(':', 'h');

    // TODO: format the origin and destination strings to remove spaces and special characters

    return parameters;
}