const selectedSeries = {}

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


function genTags(json) {
    for (const [series, details] of Object.entries(json)) {

        let newNode = document.createElement('button');
        newNode.innerHTML = details.short;
        newNode.classList.add("btn");
        newNode.classList.add("m-1");
        newNode.id = series;
        newNode.style.color = details.color;
        newNode.style.background = details.background;
        newNode.type = "button";

        document.getElementById("tags").appendChild(newNode);
    }
}
loadJson("/data/series.json", genTags);
