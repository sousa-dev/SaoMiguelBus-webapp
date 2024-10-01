document.addEventListener("DOMContentLoaded", function() {
    fetchAndPopulateStops();
    const searchBtn = document.getElementById('btnSubmit')
    searchBtn.addEventListener('click', function(event) {
        event.preventDefault();  // Prevents the default form submission action

        const parameters = getSearchParameters();
        if (parameters) {
            searchRoutes(parameters.origin, parameters.destination, parameters.day, parameters.time);
        }
    });

    loadAdBanner('home');
});

function getSearchParameters() {
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

    return {
        origin: originInput.value,
        destination: destinationInput.value,
        day: day,
        time: time
    };
}

function fetchAndPopulateStops() {
    const url = 'https://saomiguelbus-api.herokuapp.com/api/v2/stops';
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
    showLoadingSpinner();
    // Hide the routes container and the no routes message
    document.getElementById('routesContainer').style.display = 'none';
    document.getElementById('noRoutesMessage').style.display = 'none';

    const parameters = getUrlParameters(origin, destination, day, time);
    const url = 'https://saomiguelbus-api.herokuapp.com/api/v2/route?origin=' + encodeURIComponent(parameters.origin) 
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
        displayRoutes(data, parameters.origin, parameters.destination);
        hideLoadingSpinner();
    })
    .catch(error => {
        console.error('Error:', error);
        hideLoadingSpinner();
    });
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

function displayNoRoutesMessage(origin, destination) {
    const noRoutesDiv = document.getElementById('noRoutesMessage');
    const message = t('noRoutesMessage').replace('{origin}', origin).replace('{destination}', destination);
    noRoutesDiv.innerHTML = `
        <div class="container mx-auto px-4 mt-4">
            <div class="bg-red-100 shadow-md rounded-lg p-6">
                <div class="flex flex-col items-center">
                    <h3 class="text-xl font-semibold mb-2 text-center">
                        ${message}
                    </h3>
                    <p class="text-gray-600 text-center">${t('noRoutesSubtitle')}</p>
                    <button class="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onclick="redirectToStepByStepDirections(event)">
                        ${t('tryDirectionsButton')}
                    </button>
                </div>
            </div>
        </div>
    `;
    noRoutesDiv.style.display = 'block';
}

function displayRoutes(routes, originStop, destinationStop) {
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

    if (routes.length === 0) {
        displayNoRoutesMessage(originStop, destinationStop);
        return;
    }

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
        const originWords = originStop.toLowerCase().replace(/[-áàâãäéèêëíìîïóòôõöúùûüç]/g, match => {
            switch (match) {
                case 'á':
                case 'à':
                case 'â':
                case 'ã':
                case 'ä':
                    return 'a';
                case 'é':
                case 'è':
                case 'ê':
                case 'ë':
                    return 'e';
                case 'í':
                case 'ì':
                case 'î':
                case 'ï':
                    return 'i';
                case 'ó':
                case 'ò':
                case 'ô':
                case 'õ':
                case 'ö':
                    return 'o';
                case 'ú':
                case 'ù':
                case 'û':
                case 'ü':
                    return 'u';
                case 'ç':
                    return 'c';
                default:
                    return match;
            }
        }).split(' ').filter(word => word.trim() !== '' && word !== ' ');
        
        const destinationWords = destinationStop.toLowerCase().replace(/[-áàâãäéèêëíìîïóòôõöúùûüç]/g, match => {
            switch (match) {
                case 'á':
                case 'à':
                case 'â':
                case 'ã':
                case 'ä':
                    return 'a';
                case 'é':
                case 'è':
                case 'ê':
                case 'ë':
                    return 'e';
                case 'í':
                case 'ì':
                case 'î':
                case 'ï':
                    return 'i';
                case 'ó':
                case 'ò':
                case 'ô':
                case 'õ':
                case 'ö':
                    return 'o';
                case 'ú':
                case 'ù':
                case 'û':
                case 'ü':
                    return 'u';
                case 'ç':
                    return 'c';
                default:
                    return match;
            }
        }).split(' ').filter(word => word.trim() !== '' && word !== ' ');

        for (const [stop, time] of Object.entries(stopsObj)) {
            stops[stop] = time;

            const stopWords = stop.toLowerCase().replace(/[-áàâãäéèêëíìîïóòôõöúùûüç]/g, match => {
                switch (match) {
                    case 'á':
                    case 'à':
                    case 'â':
                    case 'ã':
                    case 'ä':
                        return 'a';
                    case 'é':
                    case 'è':
                    case 'ê':
                    case 'ë':
                        return 'e';
                    case 'í':
                    case 'ì':
                    case 'î':
                    case 'ï':
                        return 'i';
                    case 'ó':
                    case 'ò':
                    case 'ô':
                    case 'õ':
                    case 'ö':
                        return 'o';
                    case 'ú':
                    case 'ù':
                    case 'û':
                    case 'ü':
                        return 'u';
                    case 'ç':
                        return 'c';
                    default:
                        return match;
                }
            }).replace(/-/g, '').split(' ').filter(word => word.trim() !== '' && word !== ' ');
            for (const word of originWords) {
                if (stopWords.some(stopWord => stopWord.includes(word))) {
                    foundOrigin = true;
                    break;
                }
            }

            if (foundOrigin) {
                stops[stop] = time;
            }

            for (const word of destinationWords) {
                if (stopWords.some(stopWord => stopWord.includes(word))) {
                    foundDestination = true;
                    break;
                }
            }
            if (foundDestination) {
                if (!foundOrigin) {
                    ignoreRoute = true;
                    continue;
                }
                break;
            }
        }

        if (!foundOrigin || !foundDestination || ignoreRoute) {
            return;
        }

        const stopsArray = Object.entries(stops);   
        const firstStop = stopsArray[0];
        const lastStop = stopsArray[stopsArray.length - 1];
        
        // Calculate number of transfers
        const transferCount = route.route.split('/').length - 1;
        
        routeDiv.innerHTML = `
            <div id="route-${route.route}" class="bg-white shadow-md rounded-lg p-4 hover:shadow-lg transition-shadow duration-300">
                <div class="route-header flex items-center justify-between mb-4">
                    <div class="flex items-center">
                        <div class="route-icon text-2xl mr-2"><i class="fa-solid fa-bus"></i></div>
                        <div class="route-number text-xl font-semibold text-green-600">${route.route}</div>
                    </div>
                    <div class="text-sm text-gray-600">
                        ${transferCount > 0 ? `<i class="fa fa-shuffle mr-1"></i> ${transferCount} ${transferCount === 1 ? t('transfer') : t('transfers')}` : ''}
                    </div>
                </div>
                <div class="stops-summary flex flex-col">
                    <div class="time-line flex items-center justify-between mb-2">
                        <div class="time text-2xl font-bold text-center w-1/4">${firstStop[1]}</div>
                        <div class="route-line flex-grow mx-4 relative">
                            <div class="absolute inset-0 flex items-center">
                                <div class="h-0.5 w-full bg-gray-300 relative dashed-line">
                                    <div class="absolute inset-0 flex items-center justify-center">
                                        <span class="bg-white px-2 text-sm font-medium text-gray-500 travel-time rounded border">
                                            ${calculateTotalTravelTime(firstStop[1], lastStop[1])}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="time text-2xl font-bold text-center w-1/4">${lastStop[1]}</div>
                    </div>
                    <div class="stops flex justify-between">
                        <div class="start-stop w-1/4 pr-2">
                            <div class="location text-center">
                                <div class="text-base">${firstStop[0].split(' - ')[0]}</div>
                                <div class="text-sm text-gray-600">${firstStop[0].split(' - ').slice(1).join(' - ')}</div>
                            </div>
                        </div>
                        <div class="end-stop w-1/4 pl-2">
                            <div class="location text-center">
                                <div class="text-base">${lastStop[0].split(' - ')[0]}</div>
                                <div class="text-sm text-gray-600">${lastStop[0].split(' - ').slice(1).join(' - ')}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="mt-4 text-center">
                    <button class="expand-stops flex items-center justify-center w-full text-blue-500 hover:text-blue-700 text-base py-2">
                        <span class="mr-2">${t('clickToSeeDetails')}</span>
                        <span class="iconify transform transition-transform duration-300 text-xl" data-icon="mdi:chevron-down"></span>
                    </button>
                </div>
                <div class="all-stops mt-4 hidden">
                    ${stopsArray.map(([stop, time]) => `
                        <div class="stop-item flex justify-between items-center py-1">
                            <div class="location">
                                <div class="text-sm">${stop.split(' - ')[0]}</div>
                                <div class="text-xs text-gray-600">${stop.split(' - ').slice(1).join(' - ')}</div>
                            </div>
                            <div class="time font-medium">${time}</div>
                        </div>
                    `).join('')}
                    <div class="company mt-2 text-right text-sm text-gray-300">
                        ${(() => {
                            const routeNumbers = route.route.split('/').map(num => parseInt(num));
                            const operators = new Set();
                            
                            routeNumbers.forEach(routeNumber => {
                                if (routeNumber >= 200 && routeNumber < 300) {
                                    operators.add('Auto Viação Micaelense');
                                } else if (routeNumber >= 300 && routeNumber < 400) {
                                    operators.add('Varela & Lda.');
                                } else if (routeNumber >= 100 && routeNumber < 200) {
                                    operators.add('Caetano Raposo e Pereiras Lda.');
                                }
                            });
                            
                            if (operators.size > 0) {
                                return t('operatedBy') + ' ' + Array.from(operators).join(t('and'));
                            } else {
                                return '';
                            }
                        })()}
                    </div>
                </div>
                <div class="flex space-x-2 mt-2">
                    <button type="submit" class="flex-grow bg-green-500 text-white py-2 rounded-full hover:bg-green-600 transition duration-300 ease-in-out" data-i18n="directionsButton"
                    onclick="redirectToStepByStepDirections(event)">
                        ${t('directionsButton')} <i class="fas fa-route"></i>
                    </button>
                </div>
        </div>
        `;

        // Function to toggle route details
        function toggleRouteDetails(routeDiv) {
            const allStopsDiv = routeDiv.querySelector('.all-stops');
            const expandButton = routeDiv.querySelector('.expand-stops');
            const icon = expandButton.querySelector('.iconify');
            
            allStopsDiv.classList.toggle('hidden');
            icon.classList.toggle('rotate-180');
            
            // Smooth transition for expanding/collapsing
            if (allStopsDiv.classList.contains('hidden')) {
                allStopsDiv.style.maxHeight = '0px';
            } else {
                allStopsDiv.style.maxHeight = allStopsDiv.scrollHeight + 'px';
            }
        }

        // Add click event to expand/collapse route details
        routeDiv.addEventListener('click', function(event) {
            // Prevent the click event from triggering on buttons inside the card
            if (event.target.tagName === 'BUTTON' || event.target.closest('button')) {
                return;
            }
            
            toggleRouteDetails(this);
        });

        // Add click event to the expand button
        const expandButton = routeDiv.querySelector('.expand-stops');
        expandButton.addEventListener('click', function(event) {
            event.stopPropagation();
            toggleRouteDetails(routeDiv);
        });

        // Update the CSS
        const style = document.createElement('style');
        style.textContent = `
            .dashed-line {
                background-image: linear-gradient(to right, #CBD5E0 50%, transparent 50%);
                background-size: 8px 1px;
                background-repeat: repeat-x;
            }
            .travel-time {
                position: relative;
            }
            .travel-time::before,
            .travel-time::after {
                content: '';
                position: absolute;
                top: 50%;
                width: 20px;
                height: 1px;
                background-image: linear-gradient(to right, #CBD5E0 50%, transparent 50%);
                background-size: 4px 1px;
                background-repeat: repeat-x;
            }
            .travel-time::before {
                right: 100%;
                margin-right: 5px;
            }
            .travel-time::after {
                left: 100%;
                margin-left: 5px;
            }
            .all-stops {
                max-height: 0;
                overflow: hidden;
                transition: max-height 0.3s ease-out;
            }
            .all-stops:not(.hidden) {
                max-height: 1000px; /* Adjust this value as needed */
            }
        `;
        document.head.appendChild(style);

        routesContainer.appendChild(routeDiv);
    });

    routesContainer.style.display = 'block';
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
                        <span class="absolute top-0 left-0 bg-green-500 text-white font-bold text-[10px] px-1 py-0.5 rounded-br-lg z-10">AD</span>
                        <div class="flex justify-center">
                            <div class="w-full sm:w-2/3 md:w-1/2 lg:w-1/2">
                                <div class="ad-banner text-center p-1 relative">
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

// Add this function to handle the "Directions" button click
function showDirections(destination) {
    const encodedDestination = encodeURIComponent(destination);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedDestination}`, '_blank');
}