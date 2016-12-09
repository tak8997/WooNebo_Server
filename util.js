'use strict';

var util = function() {};


module.exports = util;

util.prototype.findPoints = function(location, max) {
    let result = {
        lat: {},
        lng: {}
    };
    let diffLat, diffLng;
    const radius = 6400000;
    const pi = Math.PI;

    diffLng = max * 360/(2*pi*radius*Math.cos(util.transform(location.lat, 'radian')));

    result.lng.min = (Number(location.lng) - diffLng);
    result.lng.max = (Number(location.lng) + diffLng);

    diffLat = max * 360 / (2 * pi * radius);

    result.lat = {
        min: (Number(location.lat) - diffLat),
        max: (Number(location.lat) + diffLat)
    }

    return result;

}
util.prototype.transform = function(data, type) {
    const pi = Math.PI;

    if (type === "degree") {
        return 360 * data / (2 * pi);
    } else if (type === "radian") {
        return 2 * pi * data / 360;
    } else {
        return false;
    }
}
