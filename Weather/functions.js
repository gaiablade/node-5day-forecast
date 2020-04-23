/**
 * Parse location input, return an ID.
 * @param {Object} request 
 * @param {Object} list 
 * @param {Object} abbrev 
 * @param {Object} locations 
 */
function wParse(request, cityList, abbrev) {
    console.log(request);
    if (request.City != undefined) {
        let cityName = nameify(request.City);
        let stateAbbrev = stateToAbbrev(request.State, abbrev);
        if (cityList[cityName] != undefined) {
            console.log("here");
            if (stateAbbrev != "") {
                for (let i = 0; i < cityList[cityName].instances.length; i++) {
                    if (cityList[cityName].instances[i].state == stateAbbrev) {
                        return {
                            status: "Good",
                            url: `id=${cityList[cityName].instances[i].code}`
                        }
                    }
                }
            }
            else if (cityList[cityName].instances.length > 1) {
                return {
                    status: "Multiples",
                    url: cityName
                }
            }
            else if (cityList[cityName].instances.length == 1) {
                return {
                    status: "Good",
                    url: `id=${cityList[cityName].instances[0].code}`
                }
            }
        }
    }
    else if (request.Zip != undefined) {
        return {
            status: "Good",
            url: `zip=${request.Zip}`
        }
    }    
    return "NONE";
}

/**
 * 
 * @param {String} str 
 * @param {Object} list 
 */
function stateToAbbrev(str, list) {
    if (str.length == 2) return str.toUpperCase();
    else if (str == "") return str;
    for (let [key, value] of Object.entries(list)) {
        if (nameify(str) == value) {
            return key;
        }
    }
    return "N/A";
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
    const day = new Date(obj.list[start].dt_txt);
    const img = getImageFromCode(obj.list[start+4].weather[0].id);
    let ret = {
        date: `${getDayOfWeek(day.getDay())}, ${day.getMonth()}/${day.getDate()}`,
        highest_temp: Math.trunc(Number(obj.list[start].main.temp)),
        lowest_temp:  Math.trunc(Number(obj.list[start].main.temp)),
        image: img.img1
    };
    for (let i = start; i < start + 8; i++) {
        if (obj.list[i].main.temp > ret.highest_temp) {
            ret.highest_temp = Math.trunc(Number(obj.list[i].main.temp));
        }
        if (obj.list[i].main.temp < ret.lowest_temp) {
            ret.lowest_temp = Math.trunc(Number(obj.list[i].main.temp));
        }
    }
    return ret;
}

/**
 * 
 * @param {Number} code 
 */
function getImageFromCode(code) {
    switch (Math.floor(code / 100)) {
        case 2: return { img1: "/images/thunderstorm_rain.png", img2: "url(\"/images/bg/thunderstorm.jpg\")" };
        case 3: return { img1: "/images/rain.png", img2: "url(\"/images/bg/rain-drops-459451.jpg\")" };
        case 5: return { img1: "/images/rain.png", img2: "url(\"/images/bg/rain-drops-459451.jpg\")" };
        case 6: return { img1: "/images/snow.png", img2: "url(\"/images/bg/snow.jpg\")" };
        case 7: return { img1: "/images/foggy.png", img2: "url(\"/images/bg/fog.jpg\")" };
        case 8: return code == 800 ? { img1: "/images/sunny.png", img2: "url(\"/images/bg/sunny.jpg\")" } : { img1: "/images/cloudy.png", img2: "url(\"/images/bg/cloudy.jpg\")" };
        default: return { img1: "/images/foggy.png", img2: "url(\"/images/bg/fog.jpg\")" };
    }
}

function createForecastObject(obj, day) {
    return {
        location: obj.city.name,
        temp: `${Math.trunc(Number(obj.list[0].main.temp))}°F`,
        status: obj.list[0].weather[0].main,
        "feels-like": `${Math.trunc(Number(obj.list[0].main.feels_like))}°F`,
        humidity: `${obj.list[0].main.humidity}%`,
        high: `${Math.trunc(Number(day.highest_temp))}°F`,
        low: `${Math.trunc(Number(day.lowest_temp))}°F`,
        image: getImageFromCode(Number(obj.list[0].weather[0].id))
    };
}

function getDayOfWeek(num) {
    switch (num) {
        case 0: return "Sunday";
        case 1: return "Monday";
        case 2: return "Tuesday";
        case 3: return "Wednesday";
        case 4: return "Thursday";
        case 5: return "Friday";
        case 6: return "Saturday";
        default: return "N/A";
    }
}

module.exports = {
    wParse: wParse,
    nameify: nameify,
    getAverages: getAverages,
    getImageFromCode: getImageFromCode,
    createForecastObject: createForecastObject
}