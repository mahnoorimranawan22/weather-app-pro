/**
 * Weather App Pro - Application Core Logic Engine
 * Architecture Framework: Vanilla ECMAScript 6 standard
 */

(function () {
    "use strict";

    // ==========================================================================
    // APPLICATION STATE MUTABLES
    // ==========================================================================
    let searchHistory = [];
    let favoriteCities = [];
    let activeWeatherPayload = null;
    let toastTimeoutIndex = null;

    // ==========================================================================
    // ELEMENT SELECTORS REFERENCE LAYER
    // ==========================================================================
    const DOM = {
        cityInput: document.getElementById('cityInput'),
        searchBtn: document.getElementById('searchBtn'),
        locationBtn: document.getElementById('locationBtn'),
        themeBtn: document.getElementById('themeBtn'),
        favoriteBtn: document.getElementById('favoriteBtn'),
        clearHistoryBtn: document.getElementById('clearHistoryBtn'),
        
        loader: document.getElementById('loader'),
        error: document.getElementById('error'),
        weatherDashboard: document.getElementById('weatherDashboard'),
        
        weatherIcon: document.getElementById('weatherIcon'),
        cityName: document.getElementById('cityName'),
        geoCoordinates: document.getElementById('geoCoordinates'),
        temperature: document.getElementById('temperature'),
        description: document.getElementById('description'),
        currentDateTime: document.getElementById('currentDateTime'),
        
        feelsLike: document.getElementById('feelsLike'),
        humidity: document.getElementById('humidity'),
        wind: document.getElementById('wind'),
        pressure: document.getElementById('pressure'),
        visibility: document.getElementById('visibility'),
        uvIndex: document.getElementById('uvIndex'),
        sunrise: document.getElementById('sunrise'),
        sunset: document.getElementById('sunset'),
        
        forecastContainer: document.getElementById('forecastContainer'),
        hourlyForecastContainer: document.getElementById('hourlyForecastContainer'),
        historyList: document.getElementById('historyList'),
        favoriteList: document.getElementById('favoriteList'),
        toast: document.getElementById('toast')
    };

    // ==========================================================================
    // INITIALIZATION ROUTINE ENTRY POINT
    // ==========================================================================
    const initializeApplication = () => {
        setupEventListeners();
        loadTheme();
        loadHistory();
        loadFavorites();
        autoLoadLastSession();
    };

    // ==========================================================================
    // EVENT HANDLING SUBSYSTEM
    // ==========================================================================
    const setupEventListeners = () => {
        DOM.searchBtn.addEventListener('click', () => searchWeather());
        
        DOM.cityInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                searchWeather();
            }
        });

        DOM.locationBtn.addEventListener('click', () => getCurrentLocation());
        DOM.themeBtn.addEventListener('click', () => toggleThemeSkin());
        DOM.favoriteBtn.addEventListener('click', () => toggleCityToFavorites());
        DOM.clearHistoryBtn.addEventListener('click', () => clearSearchHistory());
    };

    // ==========================================================================
    // CORE ASYNC API ORCHESTRATION FUNCTIONS
    // ==========================================================================
    
    /**
     * Entry hook for resolving the query specified inside the input bar
     */
    const searchWeather = async (targetQueryCity = null) => {
        const query = targetQueryCity ? targetQueryCity.trim() : DOM.cityInput.value.trim();
        if (!query) {
            showToast("Please supply a recognizable address or query entry.");
            return;
        }

        showLoader();
        hideError();

        try {
            // Step 1: Forward Resolve query via Open-Meteo Geocoding Engine
            const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
            const geoResponse = await fetch(geocodeUrl);
            
            if (!geoResponse.ok) throw new Error("Geocoding resolution failure.");
            
            const geoData = await geoResponse.json();
            if (!geoData.results || geoData.results.length === 0) {
                throw new Error(`Location query "${query}" turned up unresolved.`);
            }

            const targetLocation = geoData.results[0];
            const { latitude, longitude, name, country, admin1 } = targetLocation;
            const absoluteLocationString = `${name}${admin1 ? ', ' + admin1 : ''} (${country || ''})`;

            // Step 2: Extract data payloads from core weather endpoint
            await getWeather(latitude, longitude, absoluteLocationString, name);
            
            // Append tracking logs
            saveHistory(name);
            DOM.cityInput.value = "";
        } catch (err) {
            console.error(err);
            showError(err.message);
        } finally {
            hideLoader();
        }
    };

    /**
     * Resolves atmospheric parameters utilizing coordinates via standard public APIs
     */
    const getWeather = async (lat, lon, descriptiveName, strictCityName) => {
        // FIXED: Moved visibility to hourly query parameter array to prevent API 400 errors
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,pressure_msl,wind_speed_10m&hourly=temperature_2m,weather_code,visibility&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&timezone=auto`;
        
        const response = await fetch(weatherUrl);
        if (!response.ok) throw new Error("Atmospheric metric provider down or faulty parameters.");

        const payload = await response.json();
        
        activeWeatherPayload = {
            coordinates: { lat, lon },
            displayName: descriptiveName,
            cityName: strictCityName,
            raw: payload
        };

        updateWeather();
    };

    /**
     * Accesses physical hardware Geolocation matrices
     */
    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            showToast("Geolocation context is not supported inside this client agent.");
            return;
        }

        showLoader();
        hideError();

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                try {
                    // Reverse code coordinates back to descriptive terms
                    const revGeocodeUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
                    const revResponse = await fetch(revGeocodeUrl);
                    let detectedName = `Lat: ${latitude.toFixed(2)}, Lon: ${longitude.toFixed(2)}`;
                    let cityKey = "Current Location";

                    if (revResponse.ok) {
                        const revData = await revResponse.json();
                        cityKey = revData.city || revData.locality || "Current Location";
                        detectedName = `${cityKey}, ${revData.countryName || 'Unknown Origin'}`;
                    }
                    
                    await getWeather(latitude, longitude, detectedName, cityKey);
                } catch (err) {
                    // Fallback execution when reverse coding fails but parameters are functional
                    await getWeather(latitude, longitude, `Position [${latitude.toFixed(2)}, ${longitude.toFixed(2)}]`, "Current Position");
                } finally {
                    hideLoader();
                }
            },
            (error) => {
                hideLoader();
                let msg = "Failed to retrieve local system spatial access keys.";
                if (error.code === error.PERMISSION_DENIED) msg = "User blocked geolocation access.";
                showToast(msg);
            },
            { enableHighAccuracy: true, timeout: 7000 }
        );
    };

    // ==========================================================================
    // DOM POPULATION / RENDERING LOGIC PIPELINE
    // ==========================================================================
    const updateWeather = () => {
        if (!activeWeatherPayload) return;

        const { displayName, cityName, coordinates, raw } = activeWeatherPayload;
        const current = raw.current;
        const daily = raw.daily;
        const hourly = raw.hourly;

        // UI Frame Visibility Toggle
        DOM.weatherDashboard.classList.remove('hidden');

        // Location Info Rendering
        DOM.cityName.textContent = displayName;
        DOM.geoCoordinates.textContent = `Lat: ${coordinates.lat.toFixed(4)} | Lon: ${coordinates.lon.toFixed(4)}`;
        
        // Main Weather Calculations
        DOM.temperature.textContent = Math.round(current.temperature_2m);
        DOM.description.textContent = getWeatherDescription(current.weather_code);
        
        // Dynamic CSS Icon Mapping
        DOM.weatherIcon.className = `fa-solid ${getWeatherIcon(current.weather_code, current.is_day)}`;

        // Date and Time Parsing
        DOM.currentDateTime.textContent = `${formatDate(new Date())} | Local App Time`;

        // Secondary Metrics Grid Populate
        DOM.feelsLike.textContent = `${Math.round(current.apparent_temperature)} °C`;
        DOM.humidity.textContent = `${current.relative_humidity_2m} %`;
        DOM.wind.textContent = `${current.wind_speed_10m.toFixed(1)} km/h`;
        DOM.pressure.textContent = `${Math.round(current.pressure_msl)} hPa`;
        
        // FIXED: Parsing visibility metric accurately out of the hourly array safely
        const displayVisibility = hourly && hourly.visibility && hourly.visibility[0] ? (hourly.visibility[0] / 1000).toFixed(1) : '10.0';
        DOM.visibility.textContent = `${displayVisibility} km`;
        DOM.uvIndex.textContent = daily.uv_index_max ? daily.uv_index_max[0].toFixed(1) : '--';
        
        DOM.sunrise.textContent = formatTime(daily.sunrise[0]);
        DOM.sunset.textContent = formatTime(daily.sunset[0]);

        // Evaluate and synchronize standard target state criteria triggers
        evaluateFavoriteButtonState(cityName);

        // Process downstream structures
        renderHourlyForecast(raw.hourly, current.is_day);
        renderForecast(raw.daily);

        // Cache last session payload for automated restore calls
        localStorage.setItem('wpro_last_session', JSON.stringify({lat: coordinates.lat, lon: coordinates.lon, name: displayName, city: cityName}));
    };

    /**
     * Builds and injects micro timeline components sequentially
     */
    const renderHourlyForecast = (hourlyData, isDayNow) => {
        DOM.hourlyForecastContainer.innerHTML = "";
        
        // Parse time limits to match adjacent relevant bounds (next 24 iterations)
        const currentHourIndex = new Date().getHours();
        
        for (let i = currentHourIndex; i < currentHourIndex + 24; i++) {
            if (!hourlyData.time[i]) break;

            const hourElement = document.createElement('div');
            hourElement.className = 'hourly-card';
            
            const timeLabel = i === currentHourIndex ? "Now" : formatTime(hourlyData.time[i]);
            const tempVal = Math.round(hourlyData.temperature_2m[i]);
            const code = hourlyData.weather_code[i];
            
            // Deduce local illumination contextual state flags
            const parsedHour = new Date(hourlyData.time[i]).getHours();
            const simulatedIsDay = parsedHour > 6 && parsedHour < 19 ? 1 : 0;

            hourElement.innerHTML = `
                <span class="hourly-time">${timeLabel}</span>
                <i class="fa-solid ${getWeatherIcon(code, simulatedIsDay)} hourly-icon"></i>
                <span class="hourly-temp">${tempVal}°C</span>
            `;
            DOM.hourlyForecastContainer.appendChild(hourElement);
        }
    };

    /**
     * Instantiates macro aggregated daily list structural views
     */
    const renderForecast = (dailyData) => {
        DOM.forecastContainer.innerHTML = "";

        // Iterate through structural scopes (omitting index [0] to secure future scopes)
        for (let i = 1; i < 6; i++) {
            if (!dailyData.time[i]) break;

            const forecastRowElement = document.createElement('div');
            forecastRowElement.className = 'forecast-row';

            const dateLabel = formatDate(dailyData.time[i], true);
            const minTemp = Math.round(dailyData.temperature_2m_min[i]);
            const maxTemp = Math.round(dailyData.temperature_2m_max[i]);
            const weatherCode = dailyData.weather_code[i];
            
            forecastRowElement.innerHTML = `
                <span class="forecast-date">${dateLabel}</span>
                <div class="forecast-condition-wrapper">
                    <i class="fa-solid ${getWeatherIcon(weatherCode, 1)} forecast-icon"></i>
                    <span class="forecast-desc">${getWeatherDescription(weatherCode)}</span>
                </div>
                <span class="forecast-humidity-wrapper"><i class="fa-solid fa-droplet" style="font-size:0.75rem;"></i> Daily</span>
                <span class="forecast-temp-range">${maxTemp}° / ${minTemp}°</span>
            `;
            DOM.forecastContainer.appendChild(forecastRowElement);
        }
    };

    /**
     * Refreshes search chip interfaces in the DOM
     */
    const renderHistory = () => {
        DOM.historyList.innerHTML = "";
        if (searchHistory.length === 0) {
            DOM.historyList.innerHTML = '<span class="empty-state-text" style="font-size:0.8rem; opacity:0.6;">No recent lookups recorded.</span>';
            return;
        }

        searchHistory.forEach(city => {
            const chip = document.createElement('div');
            chip.className = 'data-chip';
            chip.innerHTML = `
                <span>${city}</span>
                <span class="remove-chip-btn" data-city="${city}"><i class="fa-solid fa-xmark"></i></span>
            `;
            
            // Route chip item interactions
            chip.addEventListener('click', (e) => {
                if (e.target.closest('.remove-chip-btn')) {
                    e.stopPropagation();
                    const targetCityName = e.target.closest('.remove-chip-btn').getAttribute('data-city');
                    deleteHistoryItem(targetCityName);
                } else {
                    searchWeather(city);
                }
            });

            DOM.historyList.appendChild(chip);
        });
    };

    /**
     * Refreshes bookmarks and favorite city interface structures
     */
    const renderFavorites = () => {
        DOM.favoriteList.innerHTML = "";
        if (favoriteCities.length === 0) {
            DOM.favoriteList.innerHTML = '<span class="empty-state-text" style="font-size:0.8rem; opacity:0.6;">No locations bookmarked.</span>';
            return;
        }

        favoriteCities.forEach(city => {
            const chip = document.createElement('div');
            chip.className = 'data-chip';
            chip.innerHTML = `
                <i class="fa-solid fa-star icon-gold" style="font-size:0.75rem;"></i>
                <span>${city}</span>
                <span class="remove-chip-btn" data-city="${city}"><i class="fa-solid fa-xmark"></i></span>
            `;

            chip.addEventListener('click', (e) => {
                if (e.target.closest('.remove-chip-btn')) {
                    e.stopPropagation();
                    const targetCityName = e.target.closest('.remove-chip-btn').getAttribute('data-city');
                    removeFavoriteCity(targetCityName);
                } else {
                    searchWeather(city);
                }
            });

            DOM.favoriteList.appendChild(chip);
        });
    };

    // ==========================================================================
    // UTILITY LOGIC SUBSYSTEMS (THEMING, LOCALSTORAGE, PARSERS)
    // ==========================================================================
    const evaluateFavoriteButtonState = (cityName) => {
        const isFavorited = favoriteCities.some(item => item.toLowerCase() === cityName.toLowerCase());
        if (isFavorited) {
            DOM.favoriteBtn.innerHTML = '<i class="fa-solid fa-star"></i>';
        } else {
            DOM.favoriteBtn.innerHTML = '<i class="fa-regular fa-star"></i>';
        }
    };

    const toggleCityToFavorites = () => {
        if (!activeWeatherPayload) return;
        const currentCity = activeWeatherPayload.cityName;
        
        const matchIndex = favoriteCities.findIndex(item => item.toLowerCase() === currentCity.toLowerCase());
        
        if (matchIndex > -1) {
            favoriteCities.splice(matchIndex, 1);
            showToast(`Removed ${currentCity} from Favorites checklist.`);
        } else {
            favoriteCities.unshift(currentCity);
            showToast(`Added ${currentCity} to saved bookmarks.`);
        }
        
        saveFavorites();
        renderFavorites();
        evaluateFavoriteButtonState(currentCity);
    };

    const removeFavoriteCity = (city) => {
        favoriteCities = favoriteCities.filter(item => item.toLowerCase() !== city.toLowerCase());
        saveFavorites();
        renderFavorites();
        if (activeWeatherPayload && activeWeatherPayload.cityName.toLowerCase() === city.toLowerCase()) {
            evaluateFavoriteButtonState(activeWeatherPayload.cityName);
        }
    };

    const saveHistory = (city) => {
        searchHistory = searchHistory.filter(item => item.toLowerCase() !== city.toLowerCase());
        searchHistory.unshift(city);
        
        if (searchHistory.length > 6) searchHistory.pop();
        
        localStorage.setItem('wpro_history', JSON.stringify(searchHistory));
        renderHistory();
    };

    const deleteHistoryItem = (city) => {
        searchHistory = searchHistory.filter(item => item.toLowerCase() !== city.toLowerCase());
        localStorage.setItem('wpro_history', JSON.stringify(searchHistory));
        renderHistory();
    };

    const clearSearchHistory = () => {
        searchHistory = [];
        localStorage.removeItem('wpro_history');
        renderHistory();
        showToast("Search logs deleted clean.");
    };

    const saveFavorites = () => localStorage.setItem('wpro_favorites', JSON.stringify(favoriteCities));
    const loadHistory = () => {
        const cached = localStorage.getItem('wpro_history');
        searchHistory = cached ? JSON.parse(cached) : [];
        renderHistory();
    };
    const loadFavorites = () => {
        const cached = localStorage.getItem('wpro_favorites');
        favoriteCities = cached ? JSON.parse(cached) : [];
        renderFavorites();
    };

    const toggleThemeSkin = () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const targetTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', targetTheme);
        localStorage.setItem('wpro_theme', targetTheme);
        updateThemeIcon(targetTheme);
    };

    const loadTheme = () => {
        const savedTheme = localStorage.getItem('wpro_theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
    };

    const updateThemeIcon = (theme) => {
        if (theme === 'dark') {
            DOM.themeBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
        } else {
            DOM.themeBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
        }
    };

    const autoLoadLastSession = () => {
        const lastSession = localStorage.getItem('wpro_last_session');
        if (lastSession) {
            const data = JSON.parse(lastSession);
            showLoader();
            getWeather(data.lat, data.lon, data.name, data.city)
                .catch(() => searchWeather("Abbottabad")) 
                .finally(() => hideLoader());
        } else {
            searchWeather("Abbottabad");
        }
    };

    // ==========================================================================
    // UI PACKAGED INFRASTRUCTURE (LOADERS, VISIBILITY, TRANSFORMS)
    // ==========================================================================
    const showLoader = () => DOM.loader.classList.remove('hidden');
    const hideLoader = () => DOM.loader.classList.add('hidden');
    
    const showError = (message) => {
        DOM.error.querySelector('.error-message').textContent = message;
        DOM.error.classList.remove('hidden');
        DOM.weatherDashboard.classList.add('hidden');
    };
    const hideError = () => DOM.error.classList.add('hidden');

    const showToast = (message) => {
        if (toastTimeoutIndex) clearTimeout(toastTimeoutIndex);
        
        DOM.toast.textContent = message;
        DOM.toast.classList.remove('hidden');

        toastTimeoutIndex = setTimeout(() => {
            DOM.toast.classList.add('hidden');
        }, 3500);
    };

    // ==========================================================================
    // DATA MAPPING PARSERS & INTERPOLATIONS
    // ==========================================================================
    
    /**
     * Converts a datetime payload or timestamp string to cleanly presented human labels
     */
    const formatDate = (inputDate, shortVersion = false) => {
        const dateObj = new Date(inputDate);
        if (shortVersion) {
            return dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        }
        return dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    /**
     * Formats structured time labels from raw timestamp profiles
     */
    const formatTime = (inputTimeStr) => {
        if (!inputTimeStr) return '--:--';
        const dateObj = new Date(inputTimeStr);
        return dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    /**
     * Translates standard WMO Weather Interpretation Codes (Open-Meteo guidelines)
     */
    const getWeatherDescription = (code) => {
        const wmoCodes = {
            0: "Clear Sky",
            1: "Mainly Clear", 2: "Partly Cloudy", 3: "Overcast",
            45: "Fog", 48: "Depositing Rime Fog",
            51: "Light Drizzle", 53: "Moderate Drizzle", 55: "Dense Drizzle",
            56: "Light Freezing Drizzle", 57: "Dense Freezing Drizzle",
            61: "Slight Rain", 63: "Moderate Rain", 65: "Heavy Rain",
            66: "Light Freezing Rain", 67: "Heavy Freezing Rain",
            71: "Slight Snow Fall", 73: "Moderate Snow Fall", 75: "Heavy Snow Fall",
            77: "Snow Grains",
            80: "Slight Rain Showers", 81: "Moderate Rain Showers", 82: "Violent Rain Showers",
            85: "Slight Snow Showers", 86: "Heavy Snow Showers",
            95: "Thunderstorm", 96: "Thunderstorm with Slight Hail", 99: "Thunderstorm with Heavy Hail"
        };
        return wmoCodes[code] !== undefined ? wmoCodes[code] : "Atmospheric Variance";
    };

    /**
     * Returns the appropriate FontAwesome weather icon based on the WMO weather code and time of day
     */
    const getWeatherIcon = (code, isDay = 1) => {
        if (code === 0) return isDay ? "fa-sun" : "fa-moon";
        if (code >= 1 && code <= 3) return isDay ? "fa-cloud-sun" : "fa-cloud-moon";
        if (code === 45 || code === 48) return "fa-smog";
        if ((code >= 51 && code <= 55) || (code >= 80 && code <= 82)) return "fa-cloud-showers-heavy";
        if (code >= 61 && code <= 65) return "fa-cloud-rain";
        if (code === 56 || code === 57 || code === 66 || code === 67) return "fa-snowflake";
        if (code >= 71 && code <= 77) return "fa-snowflake";
        if (code >= 85 && code <= 86) return "fa-snowflake";
        if (code >= 95) return "fa-cloud-bolt";
        return "fa-cloud";
    };

    // Launch Application instance compilation routine pipeline
    document.addEventListener('DOMContentLoaded', initializeApplication);
})();