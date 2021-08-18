const selectedSeries = {};
const seriesColors = {};

const LOCAL_STORAGE_ENTRY = "selectedSeries";

/** 
 * Loads a JSON file and executes a callback on it
 * @param {string}   jsonPath The path to the JSON file
 * @param {Function} callback  The callback function that receives the the JSON object as an argument
*/
function loadJson(jsonPath, callback) {
    let xhttp = new XMLHttpRequest();
    let response;
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            response = JSON.parse(xhttp.responseText);
            callback(response);
        }
    }
    xhttp.open("GET", jsonPath, true);
    xhttp.send();
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
}
loadJson("/data/series.json", genTags);
