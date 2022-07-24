class Weather {
    constructor (runtime, extensionId) {
		this.icon = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAyNS4yLjMsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgeD0iMHB4IiB5PSIwcHgiDQoJIHZpZXdCb3g9IjAgMCA0NSA0NSIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNDUgNDU7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4NCjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI+DQoJLnN0MHtmaWxsOiMwRkJEOEM7fQ0KCS5zdDF7ZmlsbDpub25lO3N0cm9rZTojRkZGRkZGO3N0cm9rZS13aWR0aDo0O3N0cm9rZS1saW5lY2FwOnJvdW5kO3N0cm9rZS1saW5lam9pbjpyb3VuZDtzdHJva2UtbWl0ZXJsaW1pdDoxMDt9DQo8L3N0eWxlPg0KPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTIxNy41MDAxNCwtMTU3LjUwMDEzKSI+DQoJPGc+DQoJCTxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik0yMTcuNSwxODBjMC0xMi40LDEwLjEtMjIuNSwyMi41LTIyLjVzMjIuNSwxMC4xLDIyLjUsMjIuNXMtMTAuMSwyMi41LTIyLjUsMjIuNVMyMTcuNSwxOTIuNCwyMTcuNSwxODANCgkJCUwyMTcuNSwxODB6Ii8+DQoJCTxnPg0KCQkJPHBhdGggY2xhc3M9InN0MSIgZD0iTTIzMC4zLDE4MC4xYzUuNy00LjcsMTMuOS00LjcsMTkuNiwwIi8+DQoJCQk8cGF0aCBjbGFzcz0ic3QxIiBkPSJNMjI1LjMsMTc1LjFjOC40LTcuNCwyMS03LjQsMjkuNCwwIi8+DQoJCQk8cGF0aCBjbGFzcz0ic3QxIiBkPSJNMjM1LjIsMTg1YzIuOS0yLjEsNi44LTIuMSw5LjcsMCIvPg0KCQkJPHBhdGggY2xhc3M9InN0MSIgZD0iTTI0MCwxOTAuNEwyNDAsMTkwLjQiLz4NCgkJPC9nPg0KCTwvZz4NCjwvZz4NCjwvc3ZnPg0K';
		this.runtime = runtime;
(function(ext) {
  var APPID = '5ac2445429e799ef82765167af5e4cc4';

  var cacheDuration = 1800000 //ms, 30 minutes
  var cachedTemps = {};

  var units = 'imperial';

  function getWeatherData(weatherData, type) {
    var val = null;
    switch (type) {
      case 'temperature':
        val = weatherData.main.temp;
        if (units === 'metric')
          val = (val - 32) * (5/9)
        val = Math.round(val);
        break;
      case 'weather':
        val = weatherData.weather[0].description;
        break;
      case 'humidity':
        val = weatherData.main.humidity;
        break;
      case 'wind speed':
        val = weatherData.wind.speed;
        if (units === 'imperial')
          val *= 2.23694;
        if (Math.round(val) !== val)
          val = val.toFixed(1);
        break;
      case 'cloudiness':
        val = weatherData.clouds.all;
        break;
    }
    return(val);
  }

  function fetchWeatherData(location, callback) {

    if (location in cachedTemps &&
        Date.now() - cachedTemps[location].time < cacheDuration) {
      //Weather data is cached
      callback(cachedTemps[location].data);
      return;
    }

    // Make an AJAX call to the Open Weather Maps API
    $.ajax({
      url: 'http://api.openweathermap.org/data/2.5/weather',
      data: {q: location, units: 'imperial', appid: APPID},
      dataType: 'jsonp',
      success: function(weatherData) {
        //Received the weather data. Cache and return the data.
        cachedTemps[location] = {data: weatherData, time: Date.now()};
        callback(weatherData);
      }
    });
  }

  // Cleanup function when the extension is unloaded
  ext._shutdown = function() {};

  // Status reporting code
  // Use this to report missing hardware, plugin or unsupported browser
  ext._getStatus = function() {
    return {status: 2, msg: 'Ready'};
  };

  ext.getWeather = function(type, location, callback) {
    fetchWeatherData(location, function(data) {
      var val = getWeatherData(data, type);
      callback(val);
    });
  };

  ext.whenWeather = function(type, location, op, val) {
    if (!cachedTemps[location]) {
      //Weather data not cached
      //Fetch it and return false for now
      fetchWeatherData(location, function(){});
      return false;
    }
    //Weather data is cached, no risk of blocking
    var data = getWeatherData(cachedTemps[location].data, type);
    switch (op) {
      case '<':
        return (data < val);
      case '=':
        return (data == val);
      case '>':
        return (data > val);
    }
  };

  ext.setUnits = function(format) {
    units = format;
    return;
  };

  ext.getUnits = function() {
    return units;
  };

  // Block and block menu descriptions
  var descriptor = {
    blocks: [
      ['R', '%m.reporterData in %s', 'getWeather', 'temperature', 'Boston, MA'],
      ['h', 'when %m.eventData in %s is %m.ops %n', 'whenWeather', 'temperature', 'Boston, MA', '>', 80],
      [' ', 'set units to %m.units', 'setUnits', 'imperial'],
      ['r', 'unit format', 'getUnits']
    ],
    menus: {
      reporterData: ['temperature', 'weather', 'humidity', 'wind speed', 'cloudiness'],
      eventData: ['temperature', 'humidity', 'wind speed', 'cloudiness'],
      ops: ['>','=', '<'],
      units: ['imperial', 'metric']
    }
  };

  // Register the extension
  ScratchExtensions.register('Weather extension', descriptor, ext);

})({});
