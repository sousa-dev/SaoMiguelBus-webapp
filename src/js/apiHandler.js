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
    const url = 'https://saomiguelbus-api.herokuapp.com/api/v1/stops';
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
    const url = 'https://saomiguelbus-api.herokuapp.com/api/v1/route?origin=' + parameters.origin 
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
            if (data && data.length > 0) {
                console.log('Displaying routes...');
                displayRoutes(data, parameters.origin);
            } else {
                displayNoRoutesMessage(parameters);
            }
        })
        .catch(error => console.error('Error fetching routes:', error));
}

function postToStats(parameters) {
    console.log("Posting to stats...");
    const url = `https://saomiguelbus-api.herokuapp.com/api/v1/stat?request=get_route&origin=${parameters.origin}&destination=${parameters.destination}&time=${parameters.time}&language=${LANG}&platform=web&day=${parameters.day}`;
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

    console.log('There are', routes.length, 'routes to display');
    console.log(routes)

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
        routeDiv.style.cssText = 'margin-top: 30px; border-radius: 8px; padding: 10px;';

        let stopsHtml = '';
        // Parse the string to a JavaScript object
        const stopsObj = stringToJSON(route.stops)

        // Iterate over the object
        for (const [stop, time] of Object.entries(stopsObj)) {
            stopsHtml += `<b>${stop}</b>: ${time} <br />`;
        }

        // Get the time for the origin stop
        const originTime = stopsObj.hasOwnProperty(originStop) ? stopsObj[originStop] : '';

        routeDiv.innerHTML = `
            <div class="row">
                <div class="col"></div>
                <div class="col">
                    <p class="card-text center-center" style="font-size: 20px; margin-left: 10px; width: 100%; text-align: center">${route.origin}</p>
                </div>
                <div class="col">
                    <p class="card-text" style="float:right; font-weight:bold; font-size: 20px; text-align: center; margin: auto; padding:10px">${originTime}</p>
                </div>
            </div>
            <div class="row">
                <div class="col" style="margin: auto">
                    <h5 class="card-title" style="font-weight: bold; margin-left: 10px; color: black;">${route.route}</h5>
                </div>
                <div class="col">
                    <p class="card-text center-center" style="font-size: 20px; font-weight: bold; width: 100%; text-align: center">&#8595</p>
                </div>
                <div class="col"></div>
            </div>
            <div class="row">
                <div class="col"></div>
                <div class="col">
                    <p class="card-text center-center" style="font-size: 20px; margin-left: 10px; width: 100%; text-align: center">${route.destination}</p>
                </div>
                <div class="col"></div>
            </div>
            <div class="row">
                <div class="col">
                    <input class="spoilerbutton" style="width: fit-content; height: fit-content; float: right; font-weight: bold; font-size: 20px; border-radius: 8px; border:0px;background-color: #218732; color: white" type="button" value="+" onclick="this.value=this.value=='+'?'-':'+';">
                    <div class="spoiler" style="display: none;">${stopsHtml}</div>
                </div>
            </div>
            ${route.information!='None' ? `<text style="color: red">${route.information}</text>` : ''}
        `;

        const spoilerButton = routeDiv.querySelector('.spoilerbutton');
        const spoilerContent = routeDiv.querySelector('.spoiler');

        spoilerButton.addEventListener('click', function() {
            if (spoilerContent.style.display === 'none' || !spoilerContent.style.display) {
                spoilerContent.style.display = 'block';
                spoilerButton.value = '-';
            } else {
                spoilerContent.style.display = 'none';
                spoilerButton.value = '+';
            }
        });

        routesContainer.appendChild(routeDiv);
    });

    routesContainer.style.display = 'block';

    document.getElementById('placeHolderForAd').scrollIntoView({ behavior: 'smooth' });
}

function loadAdBanner(on) {
    const apiUrl = `https://saomiguelbus-api.herokuapp.com/api/v1/ad?on=${on}&platform=web`;  // Replace with your API endpoint

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
                                    <a href="${ad.target}" target="_blank">
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
                    document.body.addEventListener('click', function(event) {
                        const adId = adImage.getAttribute("data-id");
                        const URL = "https://saomiguelbus-api.herokuapp.com/api/v1/ad/click?id="+ adId
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