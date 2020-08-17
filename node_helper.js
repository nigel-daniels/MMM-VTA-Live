/* Magic Mirror Module: MMM-VTA-Live helper
 * Version: 1.0.0
 *
 * By Nigel Daniels https://github.com/nigel-daniels/
 * MIT Licensed.
 */

var NodeHelper = require('node_helper');
var urllib = require('urllib');
var moment = require('moment');

module.exports = NodeHelper.create({

    start: function () {
        console.log('MMM-VTA-Live helper, started...');
		this.error = false;
		this.body = null;
		this.vtaTimes = new Map();
        },

	getVTAData: function(payload) {
        var _this = this;
		this.vtaTimes.clear();
		this.error = false;

		urllib.request(payload.url, {dataType: 'text'},function _json(err, data, res) {
			if (!err) {

				if (data) {
					var vtaData = JSON.parse(data.trim());

					var now = moment(vtaData.ServiceDelivery.ResponseTimestamp);
					var visits = vtaData.ServiceDelivery.StopMonitoringDelivery.MonitoredStopVisit;

					// Get the routes stopping here
					for (var i in visits) {
						var arrives = _this.durationInMins(now, visits[i].MonitoredVehicleJourney.MonitoredCall.ExpectedArrivalTime);
						var times = _this.vtaTimes.get(visits[i].MonitoredVehicleJourney.LineRef);

						if (times === undefined) {
							_this.vtaTimes.set(visits[i].MonitoredVehicleJourney.LineRef, [visits[i].MonitoredVehicleJourney.PublishedLineName, arrives]);
						} else {
							times.push(arrives);
							_this.vtaTimes.set(visits[i].MonitoredVehicleJourney.LineRef, times);
						}
					}
				} else {
					_this.error = true;
				}
			} else {
				_this.error = true;
			}

			// We have the response figured out so lets fire off the notifiction
			_this.sendSocketNotification('GOT-VTA-DATA', {url: payload.url, result: _this.error?null:_this.mapToObj(_this.vtaTimes)});
		});
    },

	checkStatus: function(res) {
		if (res.ok) { // res.status >= 200 && res.status < 300
        	return res;
    	} else {
        	throw 'Error';
		}
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
			case 'GET-VTA-DATA':
				this.getVTAData(payload);
				break;
			default:
				break;
		}
    }

});
