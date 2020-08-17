/* Magic Mirror Module: MMM-VTA-Live
 * Version: 1.0.0
 *
 * By Nigel Daniels https://github.com/nigel-daniels/
 * MIT Licensed.
 */

Module.register('MMM-VTA-Live', {

    defaults: {
            api_key:   '',
			agency:		'SC',
            stop_code:   0,
			stop_name:	'???',
            interval:  60000 // Every min
        },


    start:  function() {
        Log.log('Starting module: ' + this.name);

        // Set up the local values, here we construct the request url to use
        this.loaded = false;

		this.dataReq = {
			api_key: 	this.config.api_key,
			url:		'http://api.511.org/transit/StopMonitoring?api_key=' + this.config.api_key + '&agency=' + this.config.agency + '&stopcode=' + this.config.stop_code + '&format=json'
		};
        this.location = '';
        this.result = null;

        // Trigger the first request
        this.getVTAData(this);
        },


    getStyles: function() {
        return ['vta-live.css', 'font-awesome.css'];
        },

	getVTAData: function(_this) {
		// Make the initial request to the helper then set up the timer to perform the updates
		_this.sendSocketNotification('GET-VTA-DATA', _this.dataReq);
		setTimeout(_this.getVTAData, _this.config.interval, _this);
		},

    getDom: function() {
        // Set up the local wrapper
        var wrapper = document.createElement('div');
		wrapper.class = 'bright medium';

        // If we have some data to display then build the results table
        if (this.loaded) {
			stopName = document.createElement('div');
			stopName.className = 'vta_stop';
			stopName.innerHTML = this.config.stop_name;

			routeResults = document.createElement('table');
			routeResults.className = 'vta_result bright';

            if (this.result !== null) {
				for (var key in this.result) {
					var name = this.result[key][0];
					var entry = this.result[key].slice(1);

                    routeRow = document.createElement('tr');
					routeRow.className = 'vta_data vta_route';

                    routeSName = document.createElement('td');
                    routeSName.className = 'vta_sname';
					//routeSName.setAttribute('style', ('color:#' + entry.route.color));
                    routeSName.innerHTML = key;

					routeLName = document.createElement('td');
                    routeLName.className = 'vta_lname normal';
                    routeLName.innerHTML = name;

					arrivalRow = document.createElement('tr');
					arrivalRow.className = 'vta_data vta_arrivals';

					routeBlank = document.createElement('td');

                    routeTimes = document.createElement('td');
					routeTimes.className = 'vta_times normal';

					var filteredTimes = entry.filter(this.arrivalFilter);
					filteredTimes.sort(this.sortAscending);
					var timeText = filteredTimes.join(', ');

					if (filteredTimes.length !== entry.length)
						{timeText = filteredTimes.length > 0 ? 'Arriving, ' + timeText : 'Arriving';}

					routeTimes.innerHTML = timeText === 'Arriving' ? timeText : timeText + ' mins';


                    routeRow.appendChild(routeSName);
                    routeRow.appendChild(routeLName);

					arrivalRow.appendChild(routeBlank)
					arrivalRow.appendChild(routeTimes);

					routeResults.appendChild(routeRow);
					routeResults.appendChild(arrivalRow);
                    }
				wrapper.appendChild(stopName)
	            wrapper.appendChild(routeResults);
            } else {
                // Otherwise lets just use a simple div
                wrapper.innerHTML = 'Error getting stops arrival data.';
            }
        } else {
            // Otherwise lets just use a simple div
            wrapper.innerHTML = 'Loading stops arrival data...';
            }

        return wrapper;
        },

	arrivalFilter: function(element) {
		return element > 1;
		},

	sortAscending: function(a, b) {
  		return a - b;
	},

    socketNotificationReceived: function(notification, payload) {

		if (notification === 'GOT-VTA-DATA' && payload.url === this.dataReq.url) {
            // we got some data so set the flag, stash the data to display then request the dom update
            this.loaded = true;
            this.result = payload.result;
			console.log('result: ' + payload.result);
            this.updateDom(1000);
            }
        }
    });
