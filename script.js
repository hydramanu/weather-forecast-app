// DOM Elements
const searchBtn = document.getElementById("searchBtn");
const currentLocationBtn = document.getElementById("currentLocationBtn");
const cityInput = document.getElementById("cityInput");
const recentCitiesDiv = document.getElementById("recentCities");
const errorMessage = document.getElementById("errorMessage");
const currentWeatherDiv = document.getElementById("currentWeather");
const cityNameSpan = document.getElementById("cityName");
const weatherIcon = document.getElementById("weatherIcon");
const temperatureSpan = document.getElementById("temperature");
const humiditySpan = document.getElementById("humidity");
const windSpeedSpan = document.getElementById("windSpeed");
const forecastDiv = document.getElementById("forecast");
const forecastList = document.getElementById("forecastList");

// Load recent cities from localStorage
let recentCities = JSON.parse(localStorage.getItem("recentCities")) || [];

// Show recent cities in dropdown
function updateRecentCities() {
    if (recentCities.length === 0) {
        recentCitiesDiv.classList.add("hidden");
        return;
    }
    recentCitiesDiv.classList.remove("hidden");
    recentCitiesDiv.innerHTML = recentCities
        .map(city => `<div class="recent-city" data-city="${city}">${city}</div>`)
        .join("");
}

// Add city to recent searches
function addToRecentCities(city) {
    city = city.trim().toLowerCase(); // Normalize city name
    if (!recentCities.includes(city)) {
        recentCities.unshift(city);
        if (recentCities.length > 5) recentCities.pop(); // Keep only 5 recent cities
        localStorage.setItem("recentCities", JSON.stringify(recentCities));
        updateRecentCities();
    }
}

// Display current weather
function displayCurrentWeather(data) {
    errorMessage.classList.add("hidden");
    currentWeatherDiv.classList.remove("hidden");
    cityNameSpan.textContent = data.name;
    temperatureSpan.textContent = data.main.temp;
    humiditySpan.textContent = data.main.humidity;
    windSpeedSpan.textContent = data.wind.speed;
    weatherIcon.src = `http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
}

// Display 5-day forecast
function displayForecast(data) {
    forecastDiv.classList.remove("hidden");
    forecastList.innerHTML = "";
    const dailyData = data.list.filter(reading => reading.dt_txt.includes("12:00:00")).slice(0, 5);
    dailyData.forEach(day => {
        const date = new Date(day.dt * 1000).toLocaleDateString();
        forecastList.innerHTML += `
            <div class="bg-gray-100 p-2 rounded">
                <p class="font-bold">${date}</p>
                <img src="http://openweathermap.org/img/wn/${day.weather[0].icon}.png" alt="Weather Icon" class="w-12 h-12">
                <p>Temp: ${day.main.temp}°C</p>
                <p>Wind: ${day.wind.speed} km/h</p>
                <p>Humidity: ${day.main.humidity}%</p>
            </div>
        `;
    });
}

// Show error message
function showError(message) {
    errorMessage.classList.remove("hidden");
    errorMessage.textContent = message;
    currentWeatherDiv.classList.add("hidden");
    forecastDiv.classList.add("hidden");
    recentCitiesDiv.classList.add("hidden"); // Hide dropdown on error
}

// Event Listeners
searchBtn.addEventListener("click", async () => {
    const city = cityInput.value.trim();
    if (!city) {
        showError("Please enter a city name");
        return;
    }
    const result = await fetchWeatherByCity(city);
    if (result.success) {
        displayCurrentWeather(result.data);
        addToRecentCities(city);
        const forecastResult = await fetchForecast(result.data.coord.lat, result.data.coord.lon);
        if (forecastResult.success) displayForecast(forecastResult.data);
        recentCitiesDiv.classList.add("hidden"); // Hide dropdown after successful search
    } else {
        showError(result.error);
    }
});

currentLocationBtn.addEventListener("click", () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async position => {
                const { latitude, longitude } = position.coords;
                const result = await fetchWeatherByCoords(latitude, longitude);
                if (result.success) {
                    displayCurrentWeather(result.data);
                    const forecastResult = await fetchForecast(latitude, longitude);
                    if (forecastResult.success) displayForecast(forecastResult.data);
                    recentCitiesDiv.classList.add("hidden"); // Hide dropdown after successful fetch
                } else {
                    showError(result.error);
                }
            },
            () => showError("Unable to access location")
        );
    } else {
        showError("Geolocation not supported by your browser");
    }
});

// Event delegation for dropdown clicks
recentCitiesDiv.addEventListener("click", async (e) => {
    const cityElement = e.target.closest(".recent-city");
    if (cityElement) {
        const city = cityElement.dataset.city;
        cityInput.value = city; // Update input field with selected city
        const result = await fetchWeatherByCity(city);
        if (result.success) {
            displayCurrentWeather(result.data);
            const forecastResult = await fetchForecast(result.data.coord.lat, result.data.coord.lon);
            if (forecastResult.success) displayForecast(forecastResult.data);
            recentCitiesDiv.classList.add("hidden"); // Hide dropdown after selecting a city
        } else {
            showError(result.error);
        }
    }
});

// Show/hide dropdown on input focus
cityInput.addEventListener("focus", () => {
    if (recentCities.length > 0) {
        recentCitiesDiv.classList.remove("hidden");
    }
});

cityInput.addEventListener("blur", () => {
    setTimeout(() => {
        recentCitiesDiv.classList.add("hidden");
    }, 200); // Delay to allow click event to register
});

// Initial load
updateRecentCities();