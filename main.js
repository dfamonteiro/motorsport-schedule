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
    genSessionCards();
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
                    let datePortion = new Date(start.getTime() - start.getTimezoneOffset() * 60 * 1000).toISOString().slice(0, 10);
                    // It's important to offset the datePortion by the timezone offset, so that the day the event takes place
                    // is correctly calculated (think, for example: 23h30 with a 1-hour offset would roll over to a new day)
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

function ignoreSessionEntry(sessionTimes) {
    return Date.now() > new Date(sessionTimes.finish);
}

function ignoreSeriesCard(seriesName, sessions) {
    if (!selectedSeries[seriesName]) {
        return true;
    }

    for (const [sessionName, sessionTimes] of Object.entries(sessions["sessions"])) {  
        if (!ignoreSessionEntry(sessionTimes)) {
            return false;
        }
    }
    
    return true;
}

function ignoreDayCard(series) {
    for (const [seriesName, sessions] of Object.entries(series)) {
        if (!ignoreSeriesCard(seriesName, sessions)) {
            return false;
        }
    }

    return true;
}

function genSessionEntry(sessionName, sessionTimes) {
    let timeSpan = new Date(sessionTimes.start).toString().slice(16, 21);
    if ("finish" in sessionTimes) {
        timeSpan += " - " + new Date(sessionTimes.finish).toString().slice(16, 21);
    }
    let countdown = sessionTimes.start;
    return `<li class="list-group-item d-flex"><span class="session-name">${sessionName}</span> <span class="fs-6 time-span">${timeSpan}</span> <span class="countdown" start-time="${countdown}">2D 12H 32M 41S</span></li>`;
}

function genSeriesCards(seriesName, eventName, sessions) {
    
    let sessionsHTML = "";
    for (const [sessionName, sessionTimes] of Object.entries(sessions)) {
        if (ignoreSessionEntry(sessionTimes)) {
            continue;
        }

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
        if (ignoreSeriesCard(seriesName, sessions)) {
            continue;
        }
        seriesCardsHTML += genSeriesCards(seriesName, sessions.name, sessions.sessions);
    }

    return `<div class="container m-3 flex-column" style="width: max-content;">
              <h3>
                <strong class="mx-2">${month} ${day.getDate()}</strong>
              </h3>
                 
              ${seriesCardsHTML}
            </div>`;
}

function genSessionCards() {
    sessionCardsHTML = "";
    for (const [date, series] of Object.entries(days).sort()) {
        if (ignoreDayCard(series)) {
            continue;
        }
        sessionCardsHTML += genDayCard(date, series);
    }
    document.getElementById("sessions").innerHTML = sessionCardsHTML;

    updateCountdowns();
}

sendJsonRequest("/data/series.json").then(
    genTags, 
    function err(e) {
        console.log(e);
    }
);

function genCountdownText(countDownDate) {
    // Get today's date and time
    var now = new Date().getTime();
  
    // Find the distance between now and the count down date
    var distance = countDownDate - now;
  
    // Time calculations for days, hours, minutes and seconds
    var days = Math.floor(distance / (1000 * 60 * 60 * 24));
    var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((distance % (1000 * 60)) / 1000);
  
    if (distance < 0) {
        return "LIVE";
    } else {
        // A surprisingly substantial amount of logic is required to properly display a countdown timer
        let res = "";
        let firstValue = true;

        if (days > 0 || !firstValue) {
            res += String(days) + "D ";
            firstValue = false;
        }
        if (hours > 0 || !firstValue) {
            res += String(hours)  .padStart(firstValue ? 0 : 2, "0") + "H ";
            firstValue = false;
        }
        if (minutes > 0 || !firstValue) {
            res += String(minutes).padStart(firstValue ? 0 : 2, "0") + "M ";
            firstValue = false;
        }
        if (seconds > 0 || !firstValue) {
            res += String(seconds).padStart(firstValue ? 0 : 2, "0") + "S";
            firstValue = false;
        }

        return res;
    }
}

function updateCountdowns() {
    let countdowns = document.getElementsByClassName("countdown");

    for (let countdown of countdowns) {
        let countdownText = genCountdownText(new Date(countdown.getAttribute("start-time")));
        if (countdownText === "LIVE") {
            countdown.style.backgroundColor = "#FF0000";
        }
        countdown.innerHTML = countdownText;
    }
}

setInterval(updateCountdowns, 1000);