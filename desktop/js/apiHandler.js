document.addEventListener("DOMContentLoaded", function() {
    fetchAndPopulateStops();
    const searchBtn = document.getElementById('btnSubmit')
    searchBtn.addEventListener('click', function(event) {
        event.preventDefault();  // Prevents the default form submission action

        const origin = document.getElementById('origin').value;
        const destination = document.getElementById('destination').value;
        const day = document.getElementById('day').value;
        const time = document.getElementById('time').value;

        // Call your function here, passing the origin and destination
        searchRoutes(origin, destination, day, time);
    });
    loadAdBanner('home');
});

function fetchAndPopulateStops() {
    const url = 'https://api.saomiguelbus.com/api/v1/stops';
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
    const url = 'https://api.saomiguelbus.com/api/v1/route?origin=' + parameters.origin 
    + '&destination=' + parameters.destination 
    + '&day=' + parameters.day 
    + '&start=' + parameters.time
    fetchAndDisplayRoutes(url, parameters);
    // postToStats if not in localhost 
    if (window.location.hostname != "localhost" && window.location.hostname != "127.0.0.1")
        postToStats(parameters)
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
    const url = `https://api.saomiguelbus.com/api/v1/stat?request=get_route&origin=${parameters.origin}&destination=${parameters.destination}&time=${parameters.time}&language=${LANG}&platform=web&day=${parameters.day}`;
    fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',  // Ensure CORS mode is enabled
    })
    .then(response => response.json())
    .then(data => {
        // Stats posted successfully
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}


function displayNoRoutesMessage(parameters) {
    const noRoutesDiv = document.getElementById('noRoutesMessage');
    noRoutesDiv.innerHTML = `<div class="container" data-umami-event="desktop-no-routes-message-displayed"><div class="row"><div class="col-xs-12"><h3>${LANGS[LANG].No_routes1} <b>${parameters.origin}</b> ${LANGS[LANG].No_routes2} <b>${parameters.destination}</b></h3><p>${LANGS[LANG].No_routes_subtitle}</p></div></div></div>`;
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

        originStop = originStop.split(' ').map(word => prepositions.includes(word) ? word : word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        destinationStop = routes[0].destination.split(' ').map(word => prepositions.includes(word) ? word : word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

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
            <div class="stop"><b>${firstStop[0]}</b>: ${firstStop[1]}</div>
            <div class="transfer" id="transfer-info" data-umami-event="desktop-transfer-info"> <span class="arrow-icon">⬇</span> ${stopsArray.length > 2 ? `<span class="transfer-info">+${stopsArray.length - 2} ${stopsArray.length - 2 === 1 ? LANGS[LANG].Transfer : LANGS[LANG].Transfers}</span>` : ''} </div>
            <div class="intermediate-stops" style="max-height: 0; overflow: hidden; transition: max-height 0.5s ease-out;">
                ${stopsArray.slice(1, stopsArray.length - 1).map(([stop, time]) => `<div class="stop"><b style="margin-left: 10px">${stop}</b>: ${time}</div>`).join('')}
            </div>
            <div class="stop"><b>${lastStop[0]}</b>: ${lastStop[1]}</div>
        `;
    
        routeDiv.innerHTML = `
            <div class="route-header">
                <div class="route-icon">🚌</div>
                <div class="route-number">${route.route}</div>
            </div>
            <div class="stops-summary">
                ${stopsHtml}
            </div>
            <div class="route-footer">
                <div class="total-time" style="text-align: right">
                    <span>🕒 </span>
                    <span style="font-size: 16px">${calculateTotalTravelTime(firstStop[1], lastStop[1])}</span>
                </div>
            </div>
        `;
        const intermediateStops = routeDiv.querySelector('.intermediate-stops');
        const transferInfo = routeDiv.querySelector('#transfer-info');
        routeDiv.addEventListener('click', function() {
            if (intermediateStops.style.maxHeight === '0px' || !intermediateStops.style.maxHeight) {
                intermediateStops.style.maxHeight = intermediateStops.scrollHeight + 'px';
                transferInfo.style.display = 'none';
                // Adding data-umami-event with prefix 'desktop-'
                routeDiv.setAttribute('data-umami-event', 'desktop-intermediate-stops-expand');
            } else {
                intermediateStops.style.maxHeight = '0px';
                transferInfo.style.display = 'block';
                // Adding data-umami-event with prefix 'desktop-'
                routeDiv.setAttribute('data-umami-event', 'desktop-intermediate-stops-collapse');
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
    const apiUrl = `https://api.saomiguelbus.com/api/v1/ad?on=${on}&platform=web`;  // Replace with your API endpoint

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
                // Assuming ad object has properties like 'target', 'image', 'entity', 'id'
                const adBannerHTML = `
                    <div class="tm-container-outer" id="tm-section-2" data-umami-event="desktop-ad-banner-display">
                        <div class="row justify-content-center">
                            <div class="col-sm-8 col-md-6 col-lg-6">
                                <div class="ad-banner text-center p-3">
                                    <a href="${hrefValue}" target="_blank" id='ad-clickable' data-umami-event="desktop-ad-click">
                                        <img src="${ad.media}" alt="${ad.entity}" class="img-fluid" id="ad-image" data-id="${ad.id}" data-umami-event="desktop-ad-image-view">
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
                        const URL = "https://api.saomiguelbus.com/api/v1/ad/click?id="+ adId
                        fetch(URL, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            mode: 'cors',
                        })
                        .then(response => response.json())
                        .then(data => {
                            // Ad click tracked successfully
                        })
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