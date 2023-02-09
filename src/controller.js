import style from './css/style.css';
import weathericonswind from './css/weather-icons-wind.css';
import weathericonswindmin from './css/weather-icons-wind.min.css';
import weathericons from './css/weather-icons.css';
import weathericonsmin from './css/weather-icons.min.css';

import model from './model';
import View from './views/View';
import MainView from './views/mainView';
import BoxView from './views/boxView';
import ForecastView from './views/forecastView';
import SearchView from './views/searchView';

const controlWeatherDisplay = async (lat, lng) => {
  try {
    // Retrieve data to be rendered
    const weatherData = await model.getWeatherData(lat, lng);
    const forecastData = await model.getForecastData(lat, lng);

    console.log('display:', weatherData);

    // render data
    MainView.renderWeatherMain(weatherData);
    BoxView.renderWeatherBoxes(weatherData);
    ForecastView.renderHourly(forecastData.hourly);
    ForecastView.renderDaily(forecastData.daily);
  } catch (err) {
    console.error(`ERROR: ${err}`);
  }
};

const controlSearchResults = async (query) => {
  try {
    if (!query) return;

    const results = await model.getSearchResults(query);

    // Render search results
    SearchView.renderSearchResults(results);

    // Add handler to each result
    SearchView.addHandlerToEachResult(controlWeatherDisplay);
  } catch (err) {
    console.error(`ERROR: ${err}`);
  }
};

const init = async () => {
  const [lat, lng] = await model.getUserCoords();

  controlWeatherDisplay(lat, lng);
  SearchView.addHandlerLoadSearchResults(controlSearchResults);
};

init();