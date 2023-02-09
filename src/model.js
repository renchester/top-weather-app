/* eslint-disable consistent-return */
import format from 'date-fns/format';
import { getLocalTime } from './helpers';

import {
  API_KEY,
  WEATHER_API_URL,
  GEO_API_URL,
  CITIES_API_URL,
} from './config';

const model = (() => {
  const getUserLocation = () =>
    // Promisify geolocation API
    new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });

  const getUserCoords = async () => {
    try {
      const geoLoc = await getUserLocation();
      const { latitude, longitude } = geoLoc.coords;

      if (!geoLoc) throw new Error('Problem getting user location');

      return [latitude, longitude];
    } catch (err) {
      console.error(`ERROR: ${err}`);
    }
  };

  const getLocationName = async (lat, lng) => {
    try {
      // inaccurate
      const response = await fetch(
        `${GEO_API_URL}/reverse?lat=${lat}&lon=${lng}&appid=${API_KEY}`,
        { mode: 'cors' },
      );
      if (!response.ok) throw new Error('Problem getting location data');

      const data = await response.json();

      return data[0].name;
    } catch (err) {
      console.error(`ERROR: ${err}`);
    }
  };

  const getWeatherData = async (lat, lng) => {
    try {
      const response = await fetch(
        `${WEATHER_API_URL}weather?lat=${lat}&lon=${lng}&units=metric&appid=${API_KEY}`,
        { mode: 'cors' },
      );
      if (!response.ok)
        throw new Error('Problem retrieving current weather data');

      const data = await response.json();
      const now = +new Date();

      console.log('data:', data);

      return {
        cloud_cover: data.clouds.all,
        description: data.weather[0].description,
        heat_index: data.main.feels_like,
        humidity: data.main.humidity,
        id: data.weather[0].id,
        location: data.name,
        pressure: data.main.pressure,
        rain: data.rain ? data.rain['1h'] : null,
        temp: data.main.temp,
        temp_max: data.main.temp_max,
        temp_min: data.main.temp_min,
        timeOfDay:
          now < +data.sys.sunrise * 1000 || now > +data.sys.sunset * 1000
            ? 'night'
            : 'day',
        timezone: data.timezone,
        sunrise: data.sys.sunrise,
        sunset: data.sys.sunset,
        weather_id: data.weather[0].id,
        wind_direction: data.wind.deg,
        wind_speed: data.wind.speed,
        visibility: data.visibility,
      };
    } catch (err) {
      console.error(`ERROR: ${err}`);
    }
  };

  const getForecastData = async (lat, lng) => {
    try {
      const response = await fetch(
        `${WEATHER_API_URL}forecast?lat=${lat}&lon=${lng}&units=metric&appid=${API_KEY}`,
        { mode: 'cors' },
      );
      if (!response.ok) throw new Error('Problem getting forecast data');

      const data = await response.json();

      console.log('forecast:', data);

      // Filter hourly forecast
      const hourly = getHourlies(data);

      // Filter daily forecast
      const daily = getDailies(data);

      return { hourly, daily };
    } catch (err) {
      console.error(`ERROR: ${err}`);
    }
  };

  const getHourlies = (data) => {
    const hourly = [];

    const targetHours = data.list.slice(0, 9);

    targetHours.forEach((hour) => {
      const hourValue = format(
        new Date(...getLocalTime(+data.city.timezone, +hour.dt * 1000)),
        'HH',
      );

      const hourData = {
        time: hour.dt,
        temp: hour.main.temp,
        id: hour.weather[0].id,
        description: hour.weather[0].description,
        timezone: data.city.timezone,
        timeOfDay: hourValue >= 18 || hourValue <= 6 ? 'night' : 'day',
      };

      hourly.push(hourData);
    });

    return hourly;
  };

  const getDailies = (data) => {
    const daily = [];

    const day1 = [];
    const day2 = [];
    const day3 = [];
    const day4 = [];
    const day5 = [];

    // Get necessary data
    const filtered = data.list.map((stamp) => ({
      time: stamp.dt,
      temp: stamp.main.temp,
      id: stamp.weather[0].id,
      description: stamp.weather[0].description,
    }));

    // Separate timestamps into day
    filtered.forEach((stamp) => {
      const dayNow = new Date().getDate();
      const dayValue = +format(new Date(stamp.time * 1000), 'd');

      if (dayValue === dayNow + 1) day1.push(stamp);
      if (dayValue === dayNow + 2) day2.push(stamp);
      if (dayValue === dayNow + 3) day3.push(stamp);
      if (dayValue === dayNow + 4) day4.push(stamp);
      if (dayValue === dayNow + 5) day5.push(stamp);
    });

    const getMinTemp = (array) => {
      const stamp = array.reduce((prev, curr) =>
        +prev.temp < +curr.temp ? prev : curr,
      );

      return stamp.temp;
    };

    const getMaxTemp = (array) => {
      const stamp = array.reduce((prev, curr) =>
        +prev.temp > +curr.temp ? prev : curr,
      );

      return stamp.temp;
    };

    const getPredominantWeather = (array) => {
      let store = {};

      array.forEach((day) =>
        store[day.id] ? (store[day.id] += 1) : (store[day.id] = 1),
      );

      return Object.keys(store).sort((a, b) => store[b] - store[a])[0];
    };

    [day1, day2, day3, day4, day5].forEach((day) =>
      daily.push({
        time: day[0].time,
        day: format(new Date(day[0].time * 1000), 'eeee'),
        id: getPredominantWeather(day),
        min_temp: getMinTemp(day),
        max_temp: getMaxTemp(day),
      }),
    );

    return daily;
  };

  const getSearchResults = async (query) => {
    try {
      const response = await fetch(
        `${CITIES_API_URL}?limit=10&sort=-population&namePrefix=${query}`,
        {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key':
              'feafa1d619mshe17ed83e5e7db1dp1a5622jsn3b2f188ddc6c',
            'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com',
          },
        },
      );

      if (!response.ok) throw new Error('Problem getting search results');

      const data = await response.json();

      console.log('search data', data.data);

      return data.data.map((city) => ({
        name: city.city,
        region: city.region,
        country: city.country,
        latitude: city.latitude,
        longitude: city.longitude,
      }));
    } catch (err) {
      console.error(`ERROR: ${err}`);
    }
  };

  return {
    getUserCoords,
    getLocationName,
    getWeatherData,
    getForecastData,
    getSearchResults,
  };
})();

export default model;
