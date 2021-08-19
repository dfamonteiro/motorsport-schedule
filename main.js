const selectedSeries = {};
const seriesColors = {};
const days = {};

const LOCAL_STORAGE_ENTRY = "selectedSeries";

/**
 * @param {String} jsonPath The path to the JSON file
 * @returns A promise with the JSON file
 */
function sendJsonRequest(jsonPath) {
    // Code loosely based from here https://stackoverflow.com/a/31151149
    return new Promise(function (resolve, reject) {
        let xhttp = new XMLHttpRequest();

        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                let response = JSON.parse(xhttp.responseText);
                resolve(response);
            }
        }

        xhttp.error = reject;
        xhttp.open("GET", jsonPath, true);
        xhttp.send();
  });
}

/**
 * Handles a series' button press (a button press can make a series' events either appear or disappear)
 * @param {Event} event 
 */
function onButtonPressed(event) {
    selectedSeries[event.target.id] = !selectedSeries[event.target.id];
    updateSeriesColors();
    window.localStorage.setItem(LOCAL_STORAGE_ENTRY, JSON.stringify(selectedSeries));
}

/**
 * Fills in the selectedSeries object with information saved in localStorage
 * @param {JSON} json object with all the series' data
 */
function setSelectedSeries(json) {
    let old_selected_series = {};
    if (window.localStorage.getItem(LOCAL_STORAGE_ENTRY) !== null) {
        old_selected_series = JSON.parse(window.localStorage.getItem(LOCAL_STORAGE_ENTRY));
    }
    
    for (const key in json) {
        if (old_selected_series.hasOwnProperty(key)) {
            selectedSeries[key] = old_selected_series[key];
        } else {
            selectedSeries[key] = true;
        }
    }

    window.localStorage.setItem(LOCAL_STORAGE_ENTRY, JSON.stringify(selectedSeries));
}

/**
 * Updates the series' colors, depending on whether they have been selected or not
 */
function updateSeriesColors() {
    for (const [series, colors] of Object.entries(seriesColors)) {
        let button = document.getElementById(series);
        if (selectedSeries[series]) {
            button.style.color      = colors.color;
            button.style.background = colors.background;
        } else {
            button.style.color      = "#111";
            button.style.background = "#A9A9A9";
        }
    }
}

/**
 * Generates the tags from the given JSON object
 * @param {JSON} json object with all the series' data
 */
function genTags(json) {
    for (const [series, details] of Object.entries(json)) {

        let newNode = document.createElement('button');
        newNode.innerHTML = details.short;
        newNode.classList.add("btn");
        newNode.classList.add("m-1");
        newNode.id = series;
        seriesColors[series] = {color : details.color, background : details.background};
        newNode.style.fontWeight = "bold";
        newNode.type = "button";
        newNode.addEventListener("click", onButtonPressed);

        document.getElementById("tags").appendChild(newNode);
    }

    setSelectedSeries(json);
    updateSeriesColors();
    loadSessions(json);
}

/**
 * Loads the data from all the sessions of all the series
 * @param {JSON} json object with all the series' data
 */
function loadSessions(json) {
    let promises = [];

    for (const [series, details] of Object.entries(json)) {
        promises.push(sendJsonRequest("/data/" + details["file path"]));
    }

    Promise.all(promises).then((series) => {
        for (const seriesData of series) {
            for (const [event, eventData] of Object.entries(seriesData)) {
                if (event === "name") {
                    continue;
                }

                for (const [session, sessionTimes] of Object.entries(eventData)) {
                    let start = new Date(sessionTimes.start);
                    let datePortion = start.toISOString().slice(0, 10);
                    
                    if (!(datePortion in days)) {
                        days[datePortion] = {};
                    }

                    if (!(seriesData.name in days[datePortion])) {
                        days[datePortion][seriesData.name] = {name : event, sessions : {}};
                    }

                    days[datePortion][seriesData.name]["sessions"][session] = sessionTimes;
                }
            }
        }

        console.log(days);
        genSessionCards();
    });
}

function genSessionEntry(sessionName, sessionTimes) {
    let timeSpan = sessionTimes.start.slice(11, 16);
    if ("finish" in sessionTimes) {
        timeSpan += " - " + sessionTimes.finish.slice(11, 16);
    }
    let countdown = sessionTimes.start;
    return `<li class="list-group-item">${sessionName} <span class="fs-6 time-span">${timeSpan}</span> <span class="countdown" start-time="${countdown}"></span></li>`;
    // <li class="list-group-item">Practice 1 <span class="fs-6 time-span">10:30 - 11:30</span> <span class="countdown" start-time=""></span></li>
}

function genSeriesCards(seriesName, eventName, sessions) {
    
    let sessionsHTML = "";
    for (const [sessionName, sessionTimes] of Object.entries(sessions)) {
        sessionsHTML += genSessionEntry(sessionName, sessionTimes);
    }

    return `<div class="day card mb-4">
                <div class="card-header fs-5" style="color: ${seriesColors[seriesName].color}; background-color: ${seriesColors[seriesName].background};">
                    ${eventName}
                </div>
                <ul class="list-group list-group-flush fs-5">
                  ${sessionsHTML}
                </ul>
            </div>`;
}

function genDayCard(date, series) {
    let day = new Date(date);
    let month = day.toLocaleString('default', { month: 'long' });
        
    let seriesCardsHTML = "";

    for (const [seriesName, sessions] of Object.entries(series)) {
        seriesCardsHTML += genSeriesCards(seriesName, sessions.name, sessions.sessions);
    }

    return `<div id="sessions" class="container-fluid d-flex flex-wrap align-items-start justify-content-center">
              <div class="container m-3 flex-column" style="width: max-content;">
                <h3>
                  <strong class="mx-2">${month} ${day.getDate()}</strong>
                </h3>
                 
                ${seriesCardsHTML}
                 
              </div>
            </div>`;
}

function genSessionCards() {
    sessionCardsHTML = "";
    for (const [date, series] of Object.entries(days)) {
        sessionCardsHTML += genDayCard(date, series);
    }
    document.getElementById("sessions").innerHTML += sessionCardsHTML;
}

sendJsonRequest("/data/series.json").then(
    genTags, 
    function err(e) {
        console.log(e);
    }
);