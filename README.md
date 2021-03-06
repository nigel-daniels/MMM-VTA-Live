# MMM-VTA-Live
![VTA Live](vta-live.png "VTA Live.")

This a module for the [MagicMirror](https://github.com/MichMich/MagicMirror/tree/develop). This module shows the arrival times for your local stop for any of the services in the Bay Area, CA monitored by 511.org (see below). This used an older API that only monitored the VTA, hence the name.

![511.org](511SFBay_color_web.png "511.org")

Data provided by 511.org

## Installation
1. Navigate into your MagicMirror's `modules` folder and execute `git clone https://github.com/nigel-daniels/MMM-VTA-Live`.  A new folder `MMM-VTA-Live` will appear, navigate into it.
2. Execute `npm install` to install the node dependencies.

## Config
Prior to creating the config you will need to locate the `stop_code` of the station you want to monitor. This can be found by running a the `Stops` request once you have your own API key.  Although this was written for use with the VTA This can be used for any service monitored by the 511.org APIs including the BART services. You can get an API Key from the 511.org site [here](https://511.org/open-data/token).  

To collect the data you need for the options you can use the 511.org site [here]() or:

*Operator Lookup*

`http://api.511.org/transit/gtfsoperators?api_key=xxxxxxxxxxxxxxxxxxxx`

This returns the list of transit agencies covered, make a note of the `Id` for your local transit agency. For example, Bay Area Rapid Transit returns:

```
...
{
    "Id": "SC",
    "Name": "VTA",
    "LastGenerated": "2/18/2021 1:07:38 PM"
},
...
```

The value `SC` can then be used to find the local stop you want live data about.

*Stop Code Looup*

`http://api.511.org/transit/stops?api_key=xxxxxxxxxxxxxxxxxxxx&operator_id=SC`

This returns the list of stops an agency operates.  For example:
```
...
{
    "id": "64772",
    "Extensions": {
        "LocationType": "0",
        "PlatformCode": null,
        "ParentStation": "PS_STJM"
    },
    "Name": "Saint James Station",
    "Location": {
        "Longitude": "-121.890805",
        "Latitude": "37.338358"
    },
    "Url": null,
    "StopType": "onstreetBus"
},
{
    "id": "PS_STJM",
    "Extensions": {
        "LocationType": "1",
        "PlatformCode": null,
        "ParentStation": null
    },
    "Name": "Saint James Station",
    "Location": {
        "Longitude": "-121.891543",
        "Latitude": "37.338314"
    },
    "Url": null,
    "StopType": "onstreetBus"
},
{
    "id": "64749",
    "Extensions": {
        "LocationType": "0",
        "PlatformCode": null,
        "ParentStation": "PS_STJM"
    },
    "Name": "Saint James Station",
    "Location": {
        "Longitude": "-121.892183",
        "Latitude": "37.338402"
    },
    "Url": null,
    "StopType": "onstreetBus"
},
...
```

In this case we get multiple potential entries, we get the parent station and two stops (one for each direction the trains can be going) in this case the north bound trains that we want to monitor use the `id: 64749`. Its this numeric code we use in the options below.

#### Config
The entry in `config.js` can include the following options:

|Option|Description|
|---|---|
|`api_key`|**Required** This is the API key assigned to you by 511.org (see above).<br><br>**Type:** `string`<br>|
|`agency`|**Required for non-VTA stops.** This is the agency operating the service you are monitoring, this is the agency `id` for example, VTA is `SC`, BART is `BA`.<br><br>**Type:** `string`<br>**Default value:** `SC`|
|`stop_code`|**Required** This the `id` of the station you want to monitor (see above).<br><br>**Type:** `string`|
|'stop_name'|This is the name of the stop you are monitoring.<br><br>**Type:** `string`<br>**Default value:** `???`|
|`interval`|How often the status is updated. Be sure to follow the API usage guidelines when setting this.<br><br>**Type:** `integer`<br>**Default value:** `60000` // 1 minute|

Here is an example of an entry in `config.js`
```
{
    module:    'MMM-VTA-Live',
    position:  'top_left',
    header:    'VTA Rail Arrivals',
    config:	 {
                api_key:   'xxxxxxxxxxxxxxxxxxxx',
				agency:		'SC',
				stop_code:   '64749',  
				stop_name: 'St James (North)',
				interval:  60000
                }
},
```

## Dependencies
- [urllib](https://www.npmjs.com/package/urllib) (installed via `npm install`)
- [moment](https://www.npmjs.com/package/moment) (installed via `npm install`)

## Notes
Feel free to submit pull requests or post issues and I'll do my best to respond.

## Thanks To...
- [Michael Teeuw](https://github.com/MichMich) for the [MagicMirror2](https://github.com/MichMich/MagicMirror/tree/develop) framework that made this module possible.
- [511.org](https://511.org) for the guides and information they publish on their API.
- [Santa Clara Valley Transit Authority](https://www.vta.org) for publishing this useful data.
