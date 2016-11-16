'use strict';

var util = function() {};


module.exports = util;

util.findPoints = function(location, max) {
    let result = {
        lat: {},
        lng: {}
    };
    let diffLat, diffLng;
    const radius = 6400000;
    const pi = Math.PI;

    diffLat = max * 360/(2*pi*radius*Math.cos(util.transform(location.lng, 'radian')));

    result.lat.min = (Number(location.lat) - diffLat);
    result.lat.max = (Number(location.lat) + diffLat);

    diffLng = max * 360 / (2 * pi * radius);

    result.lng = {
        min: (Number(location.lng) - diffLng),
        max: (Number(location.lng) + diffLng)
    }

    return result;

}
util.transform = function(data, type) {
    const pi = Math.PI;

    if (type === "degree") {
        return 360 * data / (2 * pi);
    } else if (type === "radian") {
        return 2 * pi * data / 360;
    } else {
        return false;
    }
}
