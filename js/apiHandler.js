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
    fetch(url)
        .then(response => response.json())
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
    console.log("Searching routes from", origin, "to", destination);

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
}

function fetchAndDisplayRoutes(url, parameters) {
    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log('Routes fetched:', data);
            if (data && data.length > 0) {
                console.log('Displaying routes...');
                displayRoutes(data, parameters.origin);
            } else {
                displayNoRoutesMessage(parameters);
            }
            document.getElementById('placeHolderForAd').scrollIntoView({ behavior: 'smooth' });
        })
        .catch(error => console.error('Error fetching routes:', error));
}

function postToStats(parameters) {
    console.log("Posting to stats...");
    const url = `https://api.saomiguelbus.com/api/v1/stat?request=get_route&origin=${parameters.origin}&destination=${parameters.destination}&time=${parameters.time}&language=${LANG}&platform=web&day=${parameters.day}`;
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
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
    noRoutesDiv.innerHTML = `<div class="container"><div class="row"><div class="col-xs-12"><h3>${LANGS[LANG].No_routes1} <b>${parameters.origin}</b> ${LANGS[LANG].No_routes2} <b>${parameters.destination}</b></h3><p>${LANGS[LANG].No_routes_subtitle}</p></div></div></div>`;
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
        const routeDiv = document.createElement('div');
        routeDiv.className = 'container card w-100 center';
        routeDiv.style.cssText = 'margin-top: 30px; border-radius: 8px; padding: 10px; cursor: pointer;';
    
        // Parse the string to a JavaScript object
        const stopsObj = stringToJSON(route.stops);
        const stopsArray = Object.entries(stopsObj);
    
        // Get the first and last stops
        const firstStop = stopsArray[0];
        const lastStop = stopsArray[stopsArray.length - 1];
    
        // Generate HTML for the first and last stops and transfer information
        let stopsHtml = `
            <div class="stop"><b>${firstStop[0]}</b>: ${firstStop[1]}</div>
            <div class="transfer" id="transfer-info"> <span class="arrow-icon">⬇</span> ${stopsArray.length > 2 ? `<span class="transfer-info">+${stopsArray.length - 2} ${stopsArray.length - 2 === 1 ? LANGS[LANG].Transfer : LANGS[LANG].Transfers}</span> <span class="transfer-icon">🔀</span>` : ''} </div>
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
                <div class="total-time">
                    <span>🕒 </span>
                    <span>${calculateTotalTravelTime(stopsObj)}</span>
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
    function calculateTotalTravelTime(stopsObj) {
        const times = Object.values(stopsObj).map(timeStr => {
            const [hours, minutes] = timeStr.split('h').map(Number);
            return hours * 60 + minutes;
        });
        const totalTime = Math.max(...times) - Math.min(...times);
        const hours = Math.floor(totalTime / 60);
        const minutes = totalTime % 60;
        return `${hours}h${minutes < 10 ? '0' : ''}${minutes}`;
    }
}
    
    // Helper function to calculate total travel time
    function calculateTotalTravelTime(stopsObj) {
        const times = Object.values(stopsObj).map(timeStr => {
            const [hours, minutes] = timeStr.split('h').map(Number);
            return hours * 60 + minutes;
        });
        const totalTime = Math.max(...times) - Math.min(...times);
        const hours = Math.floor(totalTime / 60);
        const minutes = totalTime % 60;
        return `${hours}h${minutes < 10 ? '0' : ''}${minutes}`;
    }

function loadAdBanner(on) {
    const apiUrl = `https://api.saomiguelbus.com/api/v1/ad?on=${on}&platform=web`;  // Replace with your API endpoint

    fetch(apiUrl)
        .then(response => response.json())
        .then(ad => {
            if (ad) {
                // Assuming ad object has properties like 'target', 'image', 'entity', 'id'
                const adBannerHTML = `
                    <div class="tm-container-outer" id="tm-section-2">
                        <div class="row justify-content-center">
                            <div class="col-sm-8 col-md-6 col-lg-6">
                                <div class="ad-banner text-center p-3">
                                    <a href="${ad.target}" target="_blank" id='ad-clickable'>
                                        <img src="${ad.media}" alt="${ad.entity}" class="img-fluid" id="ad-image" data-id="${ad.id}">
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
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            }
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