/**
 * Parse location input.
 * @param {Object} request 
 * @param {Object} list 
 * @param {Object} abbrev 
 * @param {Object} locations 
 */
function wParse(request, list, abbrev, locations) {
    console.log(request);
    let city = nameify(request.City), state = "", zip = "";
    let parameterString = "";
    if (request.City != "") {
        if (locations[city] != undefined) {
            parameterString += `${city}`;
        }
        if (request.State.length == 2) {
            // likely an abbreviation
            if (abbrev[request.State.toUpperCase()] != undefined) {
                state = abbrev[request.State.toUpperCase()];
                parameterString += `,${state}`;
            }
        } else if (request.State != "") {
            state = nameify(request.State);
            parameterString += `,${state}`;
        }
    } else if (request.Zip != "") {
    }
    return parameterString;
}

/**
 * 
 * @param {String} str 
 */
function nameify(str) {
    let arr = str.split("");
    for (let i = 0; i < arr.length; i++) {
        if (i && arr[i-1] == ' ') {
            arr[i] = arr[i].toUpperCase();
        }
        else if (!i) {
            arr[i] = arr[i].toUpperCase();
        }
        else {
            arr[i] = arr[i].toLowerCase();
        }
    }
    return arr.join("");
}

/**
 * 
 * @param {Object} obj 
 * @param {Number} start 
 */
function getAverages(obj, start) {
    let ret = {
        highest_temp: obj.list[start].main.temp,
        lowest_temp: obj.list[start].main.temp
    };
    for (let i = start; i < start + 8; i++) {
        if (obj.list[i].main.temp > ret.highest_temp) {
            ret.highest_temp = obj.list[i].main.temp;
        }
        if (obj.list[i].main.temp < ret.lowest_temp) {
            ret.lowest_temp = obj.list[i].main.temp;
        }
    }
    return ret;
}

function getImageFromCode(code) {
    switch (Math.floor(code / 100)) {
        case 2: return "/images/thunderstorm_rain.png";
        case 3: return "/images/rain.png";
        case 5: return "/images/rain.png";
        case 6: return "/images/snow.png";
        case 7: return "/images/foggy.png";
        case 8: return code == 800 ? "/images/sunny.png" : "/images/cloudy.png";
        default: return "/images/sunny.png";
    }
}

module.exports = {
    wParse: wParse,
    nameify: nameify,
    getAverages: getAverages,
    getImageFromCode: getImageFromCode
}