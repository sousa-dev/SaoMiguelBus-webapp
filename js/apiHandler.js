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

function timeStringToMinutes(timeString) {
    const [hours, minutes] = timeString.split('h').map(Number);
    return hours * 60 + minutes;
}

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
            const originSuggestions = document.getElementById('origin-suggestions');
            const destinationSuggestions = document.getElementById('destination-suggestions');
            const originStepByStepSuggestions = document.getElementById('originStepByStep-suggestions');
            const destinationStepByStepSuggestions = document.getElementById('destinationStepByStep-suggestions');

            stopsList.forEach((stop, index) => {
                // Create suggestion for origin
                const originDiv = document.createElement('div');
                originDiv.classList.add('suggestion-item', 'flex', 'flex-col'); // Add flex classes for layout

                // Create a text node for the stop name
                const stopName = document.createElement('span');
                stopName.textContent = stop['name'];
                stopName.classList.add('py-1'); // Add padding for better spacing
                stopName.addEventListener('click', function() {
                    document.getElementById('origin').value = this.textContent;
                    originSuggestions.innerHTML = ''; // Clear suggestions on selection
                });
                originDiv.appendChild(stopName);
                originSuggestions.appendChild(originDiv);

                // Add a separator line
                if (index < stopsList.length - 1) { // Avoid adding a separator after the last item
                    const separatorOrigin = document.createElement('hr');
                    separatorOrigin.style.margin = '10px 0'; // Add spacing above and below the hr
                    originDiv.appendChild(separatorOrigin);
                }

                // Create suggestion for destination
                const destinationDiv = document.createElement('div');
                destinationDiv.classList.add('suggestion-item', 'flex', 'flex-col'); // Add flex classes for layout

                // Create a text node for the stop name
                const stopNameDest = document.createElement('span');
                stopNameDest.textContent = stop['name'];
                stopNameDest.classList.add('py-1'); // Add padding for better spacing
                stopNameDest.addEventListener('click', function() {
                    document.getElementById('destination').value = this.textContent;
                    destinationSuggestions.innerHTML = ''; // Clear suggestions on selection
                });
                destinationDiv.appendChild(stopNameDest);
                destinationSuggestions.appendChild(destinationDiv);

                // Add a separator line
                if (index < stopsList.length - 1) { // Avoid adding a separator after the last item
                    const separatorDestination = document.createElement('hr');
                    separatorDestination.style.margin = '10px 0'; // Add spacing above and below the hr
                    destinationDiv.appendChild(separatorDestination);
                }

                // Create suggestion for origin StepByStep
                const originStepByStepDiv = document.createElement('div');
                originStepByStepDiv.classList.add('suggestion-item', 'flex', 'flex-col'); // Add flex classes for layout

                // Create a text node for the stop name
                const stopNameStepByStep = document.createElement('span');
                stopNameStepByStep.textContent = stop['name'];
                stopNameStepByStep.classList.add('py-1'); // Add padding for better spacing
                stopNameStepByStep.addEventListener('click', function() {
                    document.getElementById('originStepByStep').value = this.textContent;
                    originStepByStepSuggestions.innerHTML = ''; // Clear suggestions on selection
                });
                originStepByStepDiv.appendChild(stopNameStepByStep);
                originStepByStepSuggestions.appendChild(originStepByStepDiv);

                // Add a separator line
                if (index < stopsList.length - 1) { // Avoid adding a separator after the last item
                    const separatorOriginStepByStep = document.createElement('hr');
                    separatorOriginStepByStep.style.margin = '10px 0'; // Add spacing above and below the hr
                    originStepByStepDiv.appendChild(separatorOriginStepByStep);
                }

                // Create suggestion for destination StepByStep
                const destinationStepByStepDiv = document.createElement('div');
                destinationStepByStepDiv.classList.add('suggestion-item', 'flex', 'flex-col'); // Add flex classes for layout

                // Create a text node for the stop name
                const stopNameDestStepByStep = document.createElement('span');
                stopNameDestStepByStep.textContent = stop['name'];
                stopNameDestStepByStep.classList.add('py-1'); // Add padding for better spacing
                stopNameDestStepByStep.addEventListener('click', function() {
                    document.getElementById('destinationStepByStep').value = this.textContent;
                    destinationStepByStepSuggestions.innerHTML = ''; // Clear suggestions on selection
                });
                destinationStepByStepDiv.appendChild(stopNameDestStepByStep);
                destinationStepByStepSuggestions.appendChild(destinationStepByStepDiv);

                // Add a separator line
                if (index < stopsList.length - 1) { // Avoid adding a separator after the last item
                    const separatorDestinationStepByStep = document.createElement('hr');
                    separatorDestinationStepByStep.style.margin = '10px 0'; // Add spacing above and below the hr
                    destinationStepByStepDiv.appendChild(separatorDestinationStepByStep);
                }
            });

            // Initialize autocomplete functionality
            initializeAutocomplete('origin', originSuggestions);
            initializeAutocomplete('destination', destinationSuggestions);
            initializeAutocomplete('originStepByStep', originStepByStepSuggestions);
            initializeAutocomplete('destinationStepByStep', destinationStepByStepSuggestions);
        })
        .catch(error => {
            console.error('Error fetching stops:', error);
        });
}

/**
 * Initializes the autocomplete functionality for a given input and suggestions container.
 * @param {string} inputId - The ID of the input element.
 * @param {HTMLElement} suggestionsContainer - The container for suggestion items.
 */
function initializeAutocomplete(inputId, suggestionsContainer) {
    const input = document.getElementById(inputId);
    let currentFocus = -1;

    input.addEventListener('input', function() {
        const filter = this.value.toLowerCase();
        const items = suggestionsContainer.getElementsByClassName('suggestion-item');
        let visibleCount = 0;

        // Clear previous suggestions
        suggestionsContainer.innerHTML = '';

        // Fetch and populate stops based on the current input
        fetchStops(filter).then(stopsList => {
            stopsList.forEach((stop, index) => {
                const stopDiv = document.createElement('div');
                stopDiv.textContent = stop['name'];
                stopDiv.classList.add('suggestion-item');
                stopDiv.addEventListener('click', function() {
                    input.value = this.textContent; // Set the input value to the selected suggestion
                    suggestionsContainer.innerHTML = ''; // Clear suggestions on selection
                });
                suggestionsContainer.appendChild(stopDiv);
                visibleCount++;

                // Add a separator line after each suggestion except the last one
                if (index < stopsList.length - 1) {
                    const separator = document.createElement('hr');
                    separator.style.margin = '10px 0'; // Add spacing above and below the hr
                    suggestionsContainer.appendChild(separator);
                }
            });

            // Show suggestions if there are any visible
            suggestionsContainer.style.display = visibleCount > 0 ? 'block' : 'none';
        });
    });

    input.addEventListener('focus', function() {
        // Show suggestions when input is focused
        const items = suggestionsContainer.getElementsByClassName('suggestion-item');
        if (items.length > 0) {
            suggestionsContainer.style.display = 'block';
        }
    });

    input.addEventListener('blur', function() {
        // Hide suggestions when input loses focus
        setTimeout(() => {
            suggestionsContainer.style.display = 'none';
        }, 100); // Delay to allow click event on suggestion
    });

    input.addEventListener('keydown', function(e) {
        const items = suggestionsContainer.getElementsByClassName('suggestion-item');
        if (e.keyCode == 40) { // Down key
            currentFocus++;
            addActive(items);
        } else if (e.keyCode == 38) { // Up key
            currentFocus--;
            addActive(items);
        } else if (e.keyCode == 13) { // Enter key
            e.preventDefault();
            if (currentFocus > -1) {
                if (items[currentFocus]) {
                    items[currentFocus].click();
                }
            }
        }
    });

    function addActive(items) {
        if (!items) return false;
        removeActive(items);
        if (currentFocus >= items.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = items.length - 1;
        items[currentFocus].classList.add('autocomplete-active');
    }

    function removeActive(items) {
        Array.from(items).forEach(item => {
            item.classList.remove('autocomplete-active');
        });
    }

    // Close the suggestions when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target !== input) {
            suggestionsContainer.style.display = 'none';
        }
    });
}

// Function to fetch stops based on the current input
function fetchStops(filter) {
    const url = 'https://saomiguelbus-api.herokuapp.com/api/v2/stops';
    return fetch(url)
        .then(response => response.json())
        .then(data => {
            // Filter stops based on the input
            return data.filter(stop => stop.name.toLowerCase().includes(filter));
        })
        .catch(error => {
            console.error('Error fetching stops:', error);
            return [];
        });
}

function searchRoutes(origin, destination, day, time) {
    showLoadingSpinner();
    // Hide the routes container and the no routes message
    document.getElementById('routesContainer').style.display = 'none';
    document.getElementById('noRoutesMessage').style.display = 'none';

    const parameters = getUrlParameters(origin, destination, day, time);
    const url = 'https://saomiguelbus-api.herokuapp.com/api/v2/route?origin=' + encodeURIComponent(origin) 
    + '&destination=' + encodeURIComponent(destination) 
    + '&day=' + encodeURIComponent(day) 
    + '&start=' + encodeURIComponent(time);
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
        displayNoRoutesMessage(parameters.origin, parameters.destination);
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

    if (!Array.isArray(routes) || routes.length === 0 || routes.error) {
        displayNoRoutesMessage(originStop, destinationStop);
        return;
    }

    // Sort routes by origin time
    routes.sort((a, b) => {
        const aStopsObj = stringToJSON(a.stops);
        const bStopsObj = stringToJSON(b.stops);

        const aTime = aStopsObj.hasOwnProperty(originStop) ? aStopsObj[originStop] : aStopsObj[Object.keys(aStopsObj)[0]];
        const bTime = bStopsObj.hasOwnProperty(originStop) ? bStopsObj[originStop] : bStopsObj[Object.keys(bStopsObj)[0]];
        return aTime.localeCompare(bTime);
    });


    var lastRoute = null;
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
        let firstStop = null;
        let lastStop = null;
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
            
            if (foundOrigin) {
                stops[stop] = time;
            } else {
                for (const word of originWords) {
                    if (stopWords.some(stopWord => stopWord.includes(word))) {
                        foundOrigin = true;
                        firstStop = [stop, time];
                        stops[stop] = time;
                        break;
                    }
                }
            }

            for (const word of destinationWords) {
                if (stopWords.some(stopWord => stopWord.includes(word))) {
                    foundDestination = true;
                    lastStop = [stop, time];
                    stops[stop] = time;
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

        if (!foundOrigin || !foundDestination) {
            return;
        }

        if (lastRoute) {
            const timeDifference = Math.abs(timeStringToMinutes(firstStop[1]) - timeStringToMinutes(lastRoute.firstStop[1]));
            const sameLastStop = lastStop[0] === lastRoute.lastStop[0];
            if (timeDifference < 3 || sameLastStop) {
                const currentHasC = route.route.includes('C');
                const lastHasC = lastRoute.route.includes('C');

                if (currentHasC && !lastHasC) {
                    // Prefer the lastRoute over currentRoute, so ignore currentRoute
                    return;
                } else if (!currentHasC && lastHasC) {
                    // Replace lastRoute with currentRoute
                    // Remove lastRoute's div from DOM
                    if (lastRoute.div && lastRoute.div.parentNode) {
                        routesContainer.removeChild(lastRoute.div);
                    }
                } else {
                    // Both have 'C' or neither have 'C', keep the first one (lastRoute)
                    return;
                }
            }
        }

        const stopsArray = Object.entries(stops); 

        var transferCount = route.route.split('/').length - 1;
        transferCount = Math.min(transferCount, stopsArray.length - 2);

        const travelTime = calculateTotalTravelTime(firstStop[1], lastStop[1]);

        if (travelTime.hours > 4) {
            ignoreRoute = true;
            return;
        }

        routeDiv.innerHTML = `
            <div id="route-${route.route}" class="bg-white shadow-md rounded-lg p-4 hover:shadow-lg transition-shadow duration-300">
                <div class="route-header flex items-center justify-between mb-4">
                    <div class="flex items-center">
                        <div class="route-icon text-2xl mr-2"><i class="fa-solid fa-bus"></i></div>
                        <!-- <div class="route-number text-xl font-semibold text-green-600">${route.route}</div> -->
                        ${route.route.includes('C') ? `
                            <div class="confirmation-banner bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-1 mb-1 cursor-pointer flex justify-between items-center" onclick="document.getElementById('confirmationModal').classList.remove('hidden');">
                                <div>
                                    <p class="font-bold text-xs">${t('confirmationRequired')}</p>
                                    <p class="text-xs">${t('confirmationMessage')}</p>
                                </div>
                                <i class="fas fa-phone-alt text-yellow-700 text-lg mr-2"></i>
                            </div>
                            <div id="confirmationModal" class="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center hidden" onclick="document.getElementById('confirmationModal').classList.add('hidden');">
                                <div class="bg-white rounded-lg p-6 w-80 relative" onclick="event.stopPropagation();">
                                    <button id="closeConfirmationModal" class="text-gray-600 w-full text-right hover:text-gray-800 transition duration-300 ease-in-out mb-2" onclick="document.getElementById('confirmationModal').classList.add('hidden');">
                                        <i class="fas fa-times text-xl text-right"></i>
                                    </button>
                                    <h3 class="text-xl font-semibold text-green-600 mb-3" data-i18n="contactBusCompaniesTitle">Contato das Companhias de Autocarros</h3>
                                    <p class="text-gray-700 text-sm" data-i18n="confirmBusCompaniesDescription">
                                    Se não tem a certeza da existência desta rota, entre em contato com as companhias de autocarros diretamente para confirmá-la.
                                    </p>
                                    <ul class="list-disc list-inside text-gray-700 mt-2 space-y-2">
                                        <li>
                                            <strong class="text-sm">Auto Viação Micaelense, Lda.</strong>
                                            <br>
                                            <span class="text-gray-500 text-xs ml-4">Telefone: <a href="tel:+351296301358" class="text-blue-500 hover:underline">+351 296 301 358</a></span>
                                        </li>
                                        <li>
                                            <strong class="text-sm">Varela & Companhia, Lda.</strong>
                                            <br>
                                            <span class="text-gray-500 text-xs ml-4">Telefone: <a href="tel:+351296301800" class="text-blue-500 hover:underline">+351 296 301 800</a></span>
                                        </li>
                                        <li>
                                            <strong class="text-sm">Caetano Raposo e Pereiras, Lda.</strong>
                                            <br>
                                            <span class="text-gray-500 text-xs ml-4">Telefone: <a href="tel:+351296304260" class="text-blue-500 hover:underline">+351 296 304 260</a></span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        ` : ''}
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
                                            ${travelTime.formatted}
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
                    <!-- 
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
                    -->
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

        if (!ignoreRoute) {
            routesContainer.appendChild(routeDiv);
        }
        lastRoute = { firstStop, lastStop, route: route.route, div: routeDiv }; // Store the first and last stop for comparison
    });

    routesContainer.style.display = 'block';
}

function loadAdBanner(on) {
    const apiUrl = `https://saomiguelbus-api.herokuapp.com/api/v1/ad?on=${on}&platform=web`;  // Replace with your API endpoint

    fetch(apiUrl)
        .then(response => { 
            if (response.ok) {
                return response.json();
            } else {
                console.warn('There are no ad banners available to display')
            }
        })
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