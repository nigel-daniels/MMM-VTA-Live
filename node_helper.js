/* Magic Mirror Module: MMM-VTA-Live helper
 * Version: 1.0.0
 *
 * By Nigel Daniels https://github.com/nigel-daniels/
 * MIT Licensed.
 */

var NodeHelper = require('node_helper');
var request = require('request');
var moment = require('moment');

module.exports = NodeHelper.create({

    start: function () {
        console.log('MMM-VTA-Live helper, started...');

        // Set up the local values
		this.routes = new Map();
        this.arrivalCache = new Map();
        },


    getVTARoutes: function(payload) {

		this.agency_id = payload.agency_id;
        var _this = this;

		var reqOptions = {
			url:		payload.url,
			method:		'GET',
			headers:	{
				'X-Mashape-Key':	payload.api_key,
				'Accept':			'application/json'
			}
		}

        request(reqOptions, function(error, response, body) {

            // Check to see if we are error free and got an OK response
            if (!error && response.statusCode == 200) {
                // Let's get the routes
				var result = JSON.parse(body);
				var routes = result.data[_this.agency_id];

				// Empty the old data
				_this.routes.clear();

				// Now cache the routes in a map
				for (var i in routes) {
					if (routes[i].is_active) {
						var color = (routes[i].color === undefined || routes[i].color === '' || routes[i].color === '000000') ? 'ffffff' : routes[i].color;

						var route = {
							short_name: routes[i].short_name,
							long_name: routes[i].long_name,
							color:	color
						}
						_this.routes.set(routes[i].route_id, route);
					}
				}
            }
            // We have the response figured out so lets fire off the notifiction
            _this.sendSocketNotification('GOT-VTA-ROUTES', {url: payload.url});
            });
        },


	getVTAData: function(payload) {
        var _this = this;

		var reqOptions = {
			url:		payload.url,
			method:		'GET',
			headers:	{
				'X-Mashape-Key':	payload.api_key,
				'Accept':			'application/json'
			}
		}

        request(reqOptions, function(error, response, body) {
			var vtaResult = new Map();

            // Check to see if we are error free and got an OK response
            if (!error && response.statusCode == 200) {

                // Let's get the data we need
				var result = JSON.parse(body);
				var arrivals = result.data[0].arrivals;
				var now = moment(result.generated_on);

				// First clear out the arrival cache of any arrivals that happened before now
				for (var [key,value] of _this.arrivalCache) {
					var arrival = moment(value.arrival_at);

					if (arrival.isBefore(result.generated_on)) {
						_this.arrivalCache.delete(key);
						}
					}

				// Now populate the arrival cache
				for (var i = 0; i < arrivals.length; i++) {
					var arrival = _this.arrivalCache.get(arrivals[i].vehicle_id);

					if (arrival === undefined) {
						var newArrival = {
							route_id: 	arrivals[i].route_id,
							arrival_at:	arrivals[i].arrival_at
							}

						_this.arrivalCache.set(arrivals[i].vehicle_id, newArrival);
					} else {
						arrival.arrival_at = arrivals[i].arrival_at;

						_this.arrivalCache.set(arrivals[i].vehicle_id, arrival);
						}
					}

				// Now go thru the arrival cache and build the response.
				for (var [key,arrival] of _this.arrivalCache) {
					var arrives = vtaResult.get(arrival.route_id);

					if (arrives === undefined) {
						var mins = _this.durationInMins(now, arrival.arrival_at);
						var arrives = {
							route: _this.routes.get(arrival.route_id),
							times: [mins]
							}

						vtaResult.set(arrival.route_id, arrives);
					} else {
						var mins = _this.durationInMins(now, arrival.arrival_at);

						arrives.times.push(mins);

						vtaResult.set(arrival.route_id, arrives);
						}
					}
				}

				// We have the response figured out so lets fire off the notifiction
	            _this.sendSocketNotification('GOT-VTA-DATA', {url: payload.url, result: _this.mapToObj(vtaResult)});
			});
        },

	durationInMins: function(startTime, endTime) {
		var time = moment(endTime);
		var duration = moment.duration(time.diff(startTime));
		return Math.round(duration.asMinutes());
		},

	mapToObj: function(map) {
    	let obj = {};

    	map.forEach(function(value, key){
        	obj[key] = value
    		});

    	return obj;
		},

    socketNotificationReceived: function(notification, payload) {
        // Check this is for us and if it is let's get the routes or the data
        switch(notification) {
			case 'GET-VTA-ROUTES':
				this.getVTARoutes(payload);
				break;
			case 'GET-VTA-DATA':
				this.getVTAData(payload);
				break;
			default:
				break;
			}
        }

    });
