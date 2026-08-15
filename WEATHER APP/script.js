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
    let unitPreference = 'c';
    let feedbackMuted = false;
    let comparisonCities = [];
    let lastFetchTimestamp = null;
    let daylightCache = null;
    let photoBackdropEnabled = true;
    let slideshowEnabled = false;
    let slideshowTimer = null;
    let slideshowIndex = 0;
    let suggestionItems = [];
    let suggestionIndex = -1;
    let suggestionDebounce = null;
    const WEATHER_CACHE_TTL = 600000;

    // ==========================================================================
    // ELEMENT SELECTORS REFERENCE LAYER
    // ==========================================================================
    const DOM = {
        cityInput: document.getElementById('cityInput'),
        suggestions: document.getElementById('suggestions'),
        searchBtn: document.getElementById('searchBtn'),
        locationBtn: document.getElementById('locationBtn'),
        themeBtn: document.getElementById('themeBtn'),
        unitBtn: document.getElementById('unitBtn'),
        refreshBtn: document.getElementById('refreshBtn'),
        favoriteBtn: document.getElementById('favoriteBtn'),
        shareBtn: document.getElementById('shareBtn'),
        exportBtn: document.getElementById('exportBtn'),
        retryBtn: document.getElementById('retryBtn'),
        clearHistoryBtn: document.getElementById('clearHistoryBtn'),
        
        loader: document.getElementById('loader'),
        error: document.getElementById('error'),
        weatherDashboard: document.getElementById('weatherDashboard'),
        
        weatherIcon: document.getElementById('weatherIcon'),
        cityName: document.getElementById('cityName'),
        heroPhoto: document.getElementById('heroPhoto'),
        cityBannerPhoto: document.getElementById('cityBannerPhoto'),
        geoCoordinates: document.getElementById('geoCoordinates'),
        temperature: document.getElementById('temperature'),
        unitGiant: document.getElementById('unitGiant'),
        description: document.getElementById('description'),
        currentDateTime: document.getElementById('currentDateTime'),
        lastUpdated: document.getElementById('lastUpdated'),
        yesterdayDelta: document.getElementById('yesterdayDelta'),
        
        feelsLike: document.getElementById('feelsLike'),
        humidity: document.getElementById('humidity'),
        wind: document.getElementById('wind'),
        windArrow: document.getElementById('windArrow'),
        windDirection: document.getElementById('windDirection'),
        windGust: document.getElementById('windGust'),
        pressure: document.getElementById('pressure'),
        pressureTrend: document.getElementById('pressureTrend'),
        cloudCover: document.getElementById('cloudCover'),
        dewPoint: document.getElementById('dewPoint'),
        aqiValue: document.getElementById('aqiValue'),
        aqiLabel: document.getElementById('aqiLabel'),
        muteBtn: document.getElementById('muteBtn'),
        visibility: document.getElementById('visibility'),
        uvIndex: document.getElementById('uvIndex'),
        sunrise: document.getElementById('sunrise'),
        sunset: document.getElementById('sunset'),
        
        forecastContainer: document.getElementById('forecastContainer'),
        hourlyForecastContainer: document.getElementById('hourlyForecastContainer'),
        trendChart: document.getElementById('trendChart'),
        insightText: document.getElementById('insightText'),
        daylightArc: document.getElementById('daylightArc'),
        daylightPhoto: document.getElementById('daylightPhoto'),
        daylightTraveled: document.getElementById('daylightTraveled'),
        daylightSun: document.getElementById('daylightSun'),
        daylightSunrise: document.getElementById('daylightSunrise'),
        daylightSunset: document.getElementById('daylightSunset'),
        daylightDuration: document.getElementById('daylightDuration'),
        daylightNoon: document.getElementById('daylightNoon'),
        daylightCountdown: document.getElementById('daylightCountdown'),
        compareInput: document.getElementById('compareInput'),
        compareAddBtn: document.getElementById('compareAddBtn'),
        compareRefreshBtn: document.getElementById('compareRefreshBtn'),
        compareGrid: document.getElementById('compareGrid'),
        backdropToggle: document.getElementById('backdropToggle'),
        slideshowToggle: document.getElementById('slideshowToggle'),
        extremeHotDate: document.getElementById('extremeHotDate'),
        extremeHotIcon: document.getElementById('extremeHotIcon'),
        extremeHotTemp: document.getElementById('extremeHotTemp'),
        extremeHotDesc: document.getElementById('extremeHotDesc'),
        extremeColdDate: document.getElementById('extremeColdDate'),
        extremeColdIcon: document.getElementById('extremeColdIcon'),
        extremeColdTemp: document.getElementById('extremeColdTemp'),
        extremeColdDesc: document.getElementById('extremeColdDesc'),
        historyList: document.getElementById('historyList'),
        favoriteList: document.getElementById('favoriteList'),
        toast: document.getElementById('toast'),
        scrollTopBtn: document.getElementById('scrollTopBtn')
    };

    // ==========================================================================
    // INITIALIZATION ROUTINE ENTRY POINT
    // ==========================================================================
    const initializeApplication = () => {
        setupEventListeners();
        loadTheme();
        loadUnit();
        loadFeedbackPref();
        loadPalette();
        loadBackdropPref();
        loadSlideshowPref();
        loadHistory();
        loadFavorites();
        loadComparison();
        tickClock();
        setInterval(tickClock, 1000);
        registerServiceWorker();
        const urlParams = new URLSearchParams(window.location.search);
        autoLoadLastSession(urlParams.get('city'));
    };

    // ==========================================================================
    // EVENT HANDLING SUBSYSTEM
    // ==========================================================================
    const setupEventListeners = () => {
        DOM.searchBtn.addEventListener('click', () => searchWeather());
        
        DOM.cityInput.addEventListener('input', () => handleCityInput());
        DOM.cityInput.addEventListener('blur', () => setTimeout(hideSuggestions, 150));
        DOM.cityInput.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown' && suggestionItems.length) {
                e.preventDefault();
                moveSuggestionHighlight(1);
            } else if (e.key === 'ArrowUp' && suggestionItems.length) {
                e.preventDefault();
                moveSuggestionHighlight(-1);
            } else if (e.key === 'Enter') {
                if (suggestionItems.length && suggestionIndex >= 0) {
                    e.preventDefault();
                    const pick = suggestionItems[suggestionIndex];
                    DOM.cityInput.value = pick.name;
                    hideSuggestions();
                    searchWeather(pick.name);
                } else {
                    searchWeather();
                }
            } else if (e.key === 'Escape') {
                hideSuggestions();
            }
        });

        // Scroll-to-top visibility + action
        window.addEventListener('scroll', toggleScrollTopButton, { passive: true });
        DOM.scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

        DOM.locationBtn.addEventListener('click', () => getCurrentLocation());
        DOM.themeBtn.addEventListener('click', () => toggleThemeSkin());
        DOM.unitBtn.addEventListener('click', () => toggleUnit());
        DOM.refreshBtn.addEventListener('click', () => refreshWeather());
        DOM.muteBtn.addEventListener('click', () => toggleFeedbackMute());
        DOM.favoriteBtn.addEventListener('click', () => toggleCityToFavorites());
        DOM.shareBtn.addEventListener('click', () => shareForecast());
        DOM.exportBtn.addEventListener('click', () => exportForecastData());
        DOM.retryBtn.addEventListener('click', () => refreshWeather());
        DOM.clearHistoryBtn.addEventListener('click', () => clearSearchHistory());
        DOM.compareAddBtn.addEventListener('click', () => addComparisonCity(DOM.compareInput.value));
        DOM.compareInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') addComparisonCity(DOM.compareInput.value);
        });
        DOM.compareRefreshBtn.addEventListener('click', () => {
            fetchComparisonWeather();
            feedbackTones.toggle();
            vibrate(10);
        });
        DOM.backdropToggle.addEventListener('click', () => togglePhotoBackdrop());
        DOM.slideshowToggle.addEventListener('click', () => toggleSlideshow());

        // Theme palette swatches
        document.querySelectorAll('.palette-swatch').forEach((sw) => {
            sw.addEventListener('click', () => selectPalette(sw.getAttribute('data-palette')));
        });

        // Global keyboard shortcut: "/" or Ctrl+K focuses the city search
        document.addEventListener('keydown', (e) => {
            if ((e.key === '/' || (e.ctrlKey && e.key.toLowerCase() === 'k')) && document.activeElement !== DOM.cityInput) {
                e.preventDefault();
                DOM.cityInput.focus();
            }
            if (e.key === 'Escape' && document.activeElement && document.activeElement.tagName === 'INPUT') {
                document.activeElement.value = "";
            }
        });
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

            // Keep the shareable deep link in sync
            try {
                history.replaceState(null, '', `?city=${encodeURIComponent(name)}`);
            } catch (err) {
                // URL rewriting is best-effort only
            }

            // User-action feedback cues
            feedbackTones.success();
            vibrate(15);
        } catch (err) {
            console.error(err);
            feedbackTones.error();
            vibrate([30, 40, 30]);
            showError(err.message);
        } finally {
            hideLoader();
        }
    };

    /**
     * Resolves atmospheric parameters utilizing coordinates via standard public APIs
     */    const readWeatherCache = (key) => {
        try {
            const entry = JSON.parse(localStorage.getItem(key));
            if (!entry || !entry.cachedAt || Date.now() - entry.cachedAt > WEATHER_CACHE_TTL) return null;
            return entry;
        } catch (err) {
            return null;
        }
    };

    const writeWeatherCache = (key, entry) => {
        try {
            localStorage.setItem(key, JSON.stringify(entry));
        } catch (err) {
            // Storage may be unavailable; caching is best-effort only
        }
    };

    const getWeather = async (lat, lon, descriptiveName, strictCityName, bypassCache = false) => {
        const cacheKey = `wpro_cache_${lat.toFixed(4)},${lon.toFixed(4)}`;

        // Serve a fresh cached payload for up to the TTL window (unless forcing a refresh)
        if (!bypassCache) {
            const cached = readWeatherCache(cacheKey);
            if (cached) {
                activeWeatherPayload = {
                    coordinates: { lat, lon },
                    displayName: descriptiveName,
                    cityName: strictCityName,
                    aqi: cached.aqi,
                    offset: cached.offset || 0,
                    pastDaily: cached.pastDaily || null,
                    raw: cached.raw
                };
                updateWeather();
                return;
            }
        }

        // FIXED: Moved visibility to hourly query parameter array to prevent API 400 errors
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m,cloud_cover,dew_point_2m&hourly=temperature_2m,weather_code,visibility,precipitation_probability,precipitation,wind_speed_10m,pressure_msl&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max&timezone=auto`;
        
        const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi&timezone=auto`;
        const pastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&past_days=1&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;

        const [response, aqiResponse, pastResponse] = await Promise.all([
            fetch(weatherUrl),
            fetch(aqiUrl).catch(() => null),
            fetch(pastUrl).catch(() => null)
        ]);

        if (!response.ok) throw new Error("Atmospheric metric provider down or faulty parameters.");

        const payload = await response.json();

        // Resolve the Air Quality Index separately (non-fatal on failure)
        let aqiValue = null;
        if (aqiResponse && aqiResponse.ok) {
            const aqiData = await aqiResponse.json();
            if (aqiData.current && aqiData.current.us_aqi != null) {
                aqiValue = Math.round(aqiData.current.us_aqi);
            }
        }

        // Resolve yesterday's daily extremes for the delta comparison (non-fatal on failure)
        let pastDaily = null;
        if (pastResponse && pastResponse.ok) {
            const pastData = await pastResponse.json();
            if (pastData.daily && pastData.daily.time && pastData.daily.time[0]) {
                pastDaily = {
                    max: pastData.daily.temperature_2m_max[0],
                    min: pastData.daily.temperature_2m_min[0]
                };
            }
        }

        const offset = payload.utc_offset_seconds || 0;

        activeWeatherPayload = {
            coordinates: { lat, lon },
            displayName: descriptiveName,
            cityName: strictCityName,
            aqi: aqiValue,
            offset,
            pastDaily,
            raw: payload
        };

        writeWeatherCache(cacheKey, { cachedAt: Date.now(), aqi: aqiValue, offset, pastDaily, raw: payload });

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
                    feedbackTones.success();
                    vibrate(15);
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

        // City photo banner + strip from the curated Unsplash pool (shimmer while loading)
        applyBgImage(DOM.cityBannerPhoto, getCityPhoto(displayName));
        applyBgImage(DOM.heroPhoto, getCityPhoto(displayName));
        
        // Main Weather Calculations
        animateValue(DOM.temperature, convertTemp(current.temperature_2m));
        DOM.description.textContent = getWeatherDescription(current.weather_code);
        DOM.unitGiant.textContent = unitSymbol();

        // Dynamic weather-themed accent override + Unsplash backdrop
        applyWeatherCondition(current.weather_code, current.is_day);
        
        // Dynamic CSS Icon Mapping
        DOM.weatherIcon.className = `fa-solid ${getWeatherIcon(current.weather_code, current.is_day)}`;

        // Date and Time Parsing (live city-local clock driven by tickClock)
        lastFetchTimestamp = Date.now();

        // Secondary Metrics Grid Populate
        animateValue(DOM.feelsLike, convertTemp(current.apparent_temperature), ' ' + unitSymbol());
        DOM.humidity.textContent = `${current.relative_humidity_2m} %`;
        DOM.wind.textContent = `${current.wind_speed_10m.toFixed(1)} km/h`;
        const windDeg = current.wind_direction_10m != null ? current.wind_direction_10m : 0;
        DOM.windArrow.style.transform = `rotate(${windDeg}deg)`;
        DOM.windDirection.textContent = getCompassDirection(windDeg);
        DOM.windGust.textContent = current.wind_gusts_10m != null ? `${current.wind_gusts_10m.toFixed(1)} km/h` : '--';
        DOM.pressure.textContent = `${Math.round(current.pressure_msl)} hPa`;
        const currentHourIndex = new Date().getHours();
        const pressure3h = hourly && hourly.pressure_msl && hourly.pressure_msl[currentHourIndex - 3] != null ? hourly.pressure_msl[currentHourIndex - 3] : null;
        const pressureDiff = pressure3h != null ? current.pressure_msl - pressure3h : null;
        if (pressureDiff == null) {
            DOM.pressureTrend.textContent = '--';
            DOM.pressureTrend.className = 'tile-submeta';
        } else if (pressureDiff > 1) {
            DOM.pressureTrend.textContent = '▲ Rising';
            DOM.pressureTrend.className = 'tile-submeta ptrend-up';
        } else if (pressureDiff < -1) {
            DOM.pressureTrend.textContent = '▼ Falling';
            DOM.pressureTrend.className = 'tile-submeta ptrend-down';
        } else {
            DOM.pressureTrend.textContent = '– Steady';
            DOM.pressureTrend.className = 'tile-submeta ptrend-flat';
        }
        DOM.cloudCover.textContent = current.cloud_cover != null ? `${current.cloud_cover} %` : '-- %';
        DOM.dewPoint.textContent = current.dew_point_2m != null ? `${convertTemp(current.dew_point_2m)}${unitSymbol()}` : '--';

        // Yesterday temperature comparison
        const todayMax = daily.temperature_2m_max[0];
        const pastDaily = activeWeatherPayload.pastDaily;
        const delta = pastDaily && todayMax != null ? todayMax - pastDaily.max : null;
        if (delta == null) {
            DOM.yesterdayDelta.textContent = '';
            DOM.yesterdayDelta.className = 'yesterday-delta';
        } else if (delta > 0.5) {
            DOM.yesterdayDelta.textContent = `▲ ${Math.round(delta)}° warmer than yesterday`;
            DOM.yesterdayDelta.className = 'yesterday-delta delta-up';
        } else if (delta < -0.5) {
            DOM.yesterdayDelta.textContent = `▼ ${Math.round(Math.abs(delta))}° cooler than yesterday`;
            DOM.yesterdayDelta.className = 'yesterday-delta delta-down';
        } else {
            DOM.yesterdayDelta.textContent = '≈ Same as yesterday';
            DOM.yesterdayDelta.className = 'yesterday-delta delta-flat';
        }

        const aqiInfo = getAqiCategory(activeWeatherPayload.aqi);
        DOM.aqiValue.textContent = activeWeatherPayload.aqi != null ? activeWeatherPayload.aqi : '--';
        DOM.aqiLabel.textContent = aqiInfo.label;
        DOM.aqiValue.className = activeWeatherPayload.aqi != null ? `tile-value aqi-${aqiInfo.tone}` : 'tile-value';
        
        // FIXED: Parsing visibility metric accurately out of the hourly array safely
        const displayVisibility = hourly && hourly.visibility && hourly.visibility[0] ? (hourly.visibility[0] / 1000).toFixed(1) : '10.0';
        DOM.visibility.textContent = `${displayVisibility} km`;
        DOM.uvIndex.textContent = daily.uv_index_max ? daily.uv_index_max[0].toFixed(1) : '--';
        
        DOM.sunrise.textContent = formatTime(daily.sunrise[0]);
        DOM.sunset.textContent = formatTime(daily.sunset[0]);

        // Evaluate and synchronize standard target state criteria triggers
        evaluateFavoriteButtonState(cityName);

        // Contextual smart insight
        DOM.insightText.textContent = getWeatherInsight(current, daily, activeWeatherPayload.aqi);

        // Process downstream structures
        renderTrendChart(raw.hourly);
        renderDaylightArc(raw.daily);
        renderHourlyForecast(raw.hourly, current.is_day);
        renderForecast(raw.daily);
        renderExtremes(raw.daily);
        tickClock();

        // Re-run the staggered entrance choreography on static panels
        restartRiseAnimations();

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
            hourElement.className = 'hourly-card rise-item';
            hourElement.style.animationDelay = `${(i - currentHourIndex) * 0.04}s`;
            if (i === currentHourIndex) hourElement.classList.add('now');
            
            const timeLabel = i === currentHourIndex ? "Now" : formatTime(hourlyData.time[i]);
            const tempVal = convertTemp(hourlyData.temperature_2m[i]);
            const code = hourlyData.weather_code[i];
            const rainProb = hourlyData.precipitation_probability ? hourlyData.precipitation_probability[i] : null;
            const precipAmt = hourlyData.precipitation ? hourlyData.precipitation[i] : null;
            const windNow = hourlyData.wind_speed_10m ? hourlyData.wind_speed_10m[i] : null;
            const rainHtml = rainProb != null
                ? `<span class="hourly-rain"><i class="fa-solid fa-droplet" style="opacity:${rainProb > 0 ? 1 : 0.3};"></i> ${rainProb}%${precipAmt != null && precipAmt > 0 ? ` · ${precipAmt.toFixed(1)}mm` : ''}</span>`
                : '<span class="hourly-rain">&nbsp;</span>';
            const windHtml = windNow != null
                ? `<span class="hourly-wind"><i class="fa-solid fa-wind"></i> ${Math.round(windNow)} km/h</span>`
                : '<span class="hourly-wind">&nbsp;</span>';
            
            // Deduce local illumination contextual state flags
            const parsedHour = new Date(hourlyData.time[i]).getHours();
            const simulatedIsDay = parsedHour > 6 && parsedHour < 19 ? 1 : 0;

            hourElement.innerHTML = `
                <span class="hourly-time">${timeLabel}</span>
                <i class="fa-solid ${getWeatherIcon(code, simulatedIsDay)} hourly-icon"></i>
                <span class="hourly-temp">${tempVal}${unitSymbol()}</span>
                ${rainHtml}
                ${windHtml}
            `;
            DOM.hourlyForecastContainer.appendChild(hourElement);
        }
    };

    /**
     * Instantiates macro aggregated daily list structural views
     */
    const renderForecast = (dailyData) => {
        DOM.forecastContainer.innerHTML = "";

        // Collect the extended outlook window (omitting today, index [0])
        const days = [];
        for (let i = 1; i < 15; i++) {
            if (!dailyData.time[i]) break;
            days.push({
                date: formatDate(dailyData.time[i], true),
                minRaw: dailyData.temperature_2m_min[i],
                maxRaw: dailyData.temperature_2m_max[i],
                min: convertTemp(dailyData.temperature_2m_min[i]),
                max: convertTemp(dailyData.temperature_2m_max[i]),
                code: dailyData.weather_code[i],
                rainProb: dailyData.precipitation_probability_max ? dailyData.precipitation_probability_max[i] : null
            });
        }
        if (days.length === 0) return;

        // Week-wide temperature bounds for the comparison bars
        const weekMin = Math.min(...days.map((d) => d.minRaw));
        const weekMax = Math.max(...days.map((d) => d.maxRaw));
        const weekRange = (weekMax - weekMin) || 1;

        days.forEach((day, index) => {
            const forecastRowElement = document.createElement('div');
            forecastRowElement.className = 'forecast-row rise-item';
            forecastRowElement.style.animationDelay = `${index * 0.07}s`;

            const leftPct = ((day.minRaw - weekMin) / weekRange) * 100;
            const widthPct = Math.max(((day.maxRaw - day.minRaw) / weekRange) * 100, 5);
            const precipHtml = day.rainProb != null
                ? `<i class="fa-solid fa-droplet" style="font-size:0.75rem; color:${day.rainProb >= 50 ? 'var(--accent-color)' : 'inherit'};"></i> ${day.rainProb}%`
                : '—';

            forecastRowElement.innerHTML = `
                <span class="forecast-date">${day.date}</span>
                <div class="forecast-condition-wrapper">
                    <i class="fa-solid ${getWeatherIcon(day.code, 1)} forecast-icon"></i>
                    <span class="forecast-desc">${getWeatherDescription(day.code)}</span>
                </div>
                <span class="forecast-humidity-wrapper">${precipHtml}</span>
                <span class="forecast-temp-range">
                    <span>${day.max}° / ${day.min}°</span>
                    <span class="forecast-range-bar"><span class="forecast-range-fill" style="left:${leftPct.toFixed(1)}%; width:${widthPct.toFixed(1)}%;"></span></span>
                </span>
            `;
            DOM.forecastContainer.appendChild(forecastRowElement);
        });
    };

    /**
     * Refreshes search chip interfaces in the DOM
     */
    const renderHistory = () => {
        DOM.historyList.innerHTML = "";
        if (searchHistory.length === 0) {
            DOM.historyList.innerHTML = '<div class="empty-state"><i class="fa-solid fa-clock-rotate-left"></i><span>No recent lookups recorded.</span></div>';
            return;
        }

        searchHistory.forEach((city, index) => {
            const chip = document.createElement('div');
            chip.className = 'data-chip rise-item';
            chip.style.animationDelay = `${Math.min(index * 0.05, 0.3)}s`;
            chip.innerHTML = `
                <span class="chip-photo"></span>
                <span>${city}</span>
                <span class="remove-chip-btn" data-city="${city}"><i class="fa-solid fa-xmark"></i></span>
            `;
            applyBgImage(chip.querySelector('.chip-photo'), getCityPhoto(city));
            
            // Route chip item interactions
            chip.setAttribute('role', 'button');
            chip.setAttribute('tabindex', '0');
            chip.setAttribute('aria-label', `Open weather for ${city}`);

            chip.addEventListener('click', (e) => {
                if (e.target.closest('.remove-chip-btn')) {
                    e.stopPropagation();
                    const targetCityName = e.target.closest('.remove-chip-btn').getAttribute('data-city');
                    deleteHistoryItem(targetCityName);
                } else {
                    searchWeather(city);
                }
            });
            chip.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    chip.click();
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
            DOM.favoriteList.innerHTML = '<div class="empty-state"><i class="fa-regular fa-star"></i><span>No locations bookmarked yet — tap the star on any city.</span></div>';
            return;
        }

        favoriteCities.forEach((city, index) => {
            const chip = document.createElement('div');
            chip.className = 'data-chip rise-item';
            chip.style.animationDelay = `${Math.min(index * 0.05, 0.3)}s`;
            chip.innerHTML = `
                <span class="chip-photo"></span>
                <i class="fa-solid fa-star icon-gold" style="font-size:0.75rem;"></i>
                <span>${city}</span>
                <span class="remove-chip-btn" data-city="${city}"><i class="fa-solid fa-xmark"></i></span>
            `;
            applyBgImage(chip.querySelector('.chip-photo'), getCityPhoto(city));

            chip.setAttribute('role', 'button');
            chip.setAttribute('tabindex', '0');
            chip.setAttribute('aria-label', `Open weather for ${city}`);

            chip.addEventListener('click', (e) => {
                if (e.target.closest('.remove-chip-btn')) {
                    e.stopPropagation();
                    const targetCityName = e.target.closest('.remove-chip-btn').getAttribute('data-city');
                    removeFavoriteCity(targetCityName);
                } else {
                    searchWeather(city);
                }
            });
            chip.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    chip.click();
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
        const snapshot = favoriteCities.slice();
        
        if (matchIndex > -1) {
            favoriteCities.splice(matchIndex, 1);
            feedbackTones.removed();
            vibrate(10);
            showToast(`Removed ${currentCity} from Favorites.`, () => {
                favoriteCities = snapshot;
                saveFavorites();
                renderFavorites();
                evaluateFavoriteButtonState(currentCity);
                feedbackTones.toggle();
            });
        } else {
            favoriteCities.unshift(currentCity);
            feedbackTones.favorite();
            vibrate(25);
            showToast(`Added ${currentCity} to saved bookmarks.`);
        }
        
        saveFavorites();
        renderFavorites();
        evaluateFavoriteButtonState(currentCity);
    };

    const removeFavoriteCity = (city) => {
        const snapshot = favoriteCities.slice();
        favoriteCities = favoriteCities.filter(item => item.toLowerCase() !== city.toLowerCase());
        saveFavorites();
        renderFavorites();
        if (activeWeatherPayload && activeWeatherPayload.cityName.toLowerCase() === city.toLowerCase()) {
            evaluateFavoriteButtonState(activeWeatherPayload.cityName);
        }
        showToast(`Removed ${city} from Favorites.`, () => {
            favoriteCities = snapshot;
            saveFavorites();
            renderFavorites();
            if (activeWeatherPayload) evaluateFavoriteButtonState(activeWeatherPayload.cityName);
            feedbackTones.toggle();
        });
    };

    const saveHistory = (city) => {
        searchHistory = searchHistory.filter(item => item.toLowerCase() !== city.toLowerCase());
        searchHistory.unshift(city);
        
        if (searchHistory.length > 6) searchHistory.pop();
        
        localStorage.setItem('wpro_history', JSON.stringify(searchHistory));
        renderHistory();
    };

    const deleteHistoryItem = (city) => {
        const snapshot = searchHistory.slice();
        searchHistory = searchHistory.filter(item => item.toLowerCase() !== city.toLowerCase());
        localStorage.setItem('wpro_history', JSON.stringify(searchHistory));
        renderHistory();
        showToast(`Removed ${city} from history.`, () => {
            searchHistory = snapshot;
            localStorage.setItem('wpro_history', JSON.stringify(searchHistory));
            renderHistory();
            feedbackTones.toggle();
        });
    };

    const clearSearchHistory = () => {
        const snapshot = searchHistory.slice();
        searchHistory = [];
        localStorage.removeItem('wpro_history');
        renderHistory();
        feedbackTones.notify();
        vibrate(10);
        showToast("Search history cleared.", () => {
            searchHistory = snapshot;
            localStorage.setItem('wpro_history', JSON.stringify(searchHistory));
            renderHistory();
            feedbackTones.toggle();
        });
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
        feedbackTones.toggle();
        vibrate(10);

        // Play a short pop animation on the swapped icon
        const themeIcon = DOM.themeBtn.querySelector('i');
        themeIcon.classList.remove('theme-swap');
        void themeIcon.offsetWidth;
        themeIcon.classList.add('theme-swap');
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

    const autoLoadLastSession = (urlCity = null) => {
        if (urlCity) {
            searchWeather(urlCity);
            return;
        }
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

    const showToast = (message, undoAction = null) => {
        if (toastTimeoutIndex) clearTimeout(toastTimeoutIndex);

        DOM.toast.innerHTML = '';
        const textSpan = document.createElement('span');
        textSpan.textContent = message;
        DOM.toast.appendChild(textSpan);

        let dismissAfter = 3500;
        if (undoAction) {
            const undoBtn = document.createElement('button');
            undoBtn.className = 'toast-undo';
            undoBtn.textContent = 'Undo';
            undoBtn.setAttribute('type', 'button');
            undoBtn.addEventListener('click', () => {
                clearTimeout(toastTimeoutIndex);
                toastTimeoutIndex = null;
                DOM.toast.classList.add('hidden');
                undoAction();
            });
            DOM.toast.appendChild(undoBtn);
            dismissAfter = 6000;
        }

        DOM.toast.classList.remove('hidden');

        toastTimeoutIndex = setTimeout(() => {
            DOM.toast.classList.add('hidden');
        }, dismissAfter);
    };

    // ==========================================================================
    // MOTION & TRANSITION CHOREOGRAPHY
    // ==========================================================================

    /**
     * Smoothly counts a numeric element up (or down) to its target value
     */
    const animateValue = (element, targetValue, suffix = '') => {
        const startValue = parseFloat(element.textContent) || 0;
        if (startValue === targetValue) {
            element.textContent = targetValue + suffix;
            return;
        }
        const duration = 700;
        const startTime = performance.now();
        const step = (now) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            element.textContent = Math.round(startValue + (targetValue - startValue) * eased) + suffix;
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    };

    /**
     * Re-runs the staggered entrance choreography on static panels
     */
    const restartRiseAnimations = () => {
        document.querySelectorAll('.main-card, .forecast-section-wrapper, .metric-tile, .insight-strip, .daylight-card, .comparison-card, .extremes-card, .city-banner').forEach((el) => {
            el.style.animation = 'none';
            void el.offsetWidth;
            el.style.animation = '';
        });
    };

    // ==========================================================================
    // TEMPERATURE UNIT SYSTEM (°C / °F)
    // ==========================================================================
    const convertTemp = (celsius) => {
        if (unitPreference === 'f') return Math.round(celsius * 9 / 5 + 32);
        return Math.round(celsius);
    };

    const unitSymbol = () => (unitPreference === 'f' ? '°F' : '°C');

    const toggleUnit = () => {
        unitPreference = unitPreference === 'c' ? 'f' : 'c';
        localStorage.setItem('wpro_unit', unitPreference);
        updateUnitButtonUI();
        feedbackTones.toggle();
        if (activeWeatherPayload) updateWeather();
        renderComparison();
    };

    const loadUnit = () => {
        const savedUnit = localStorage.getItem('wpro_unit') || 'c';
        unitPreference = savedUnit === 'f' ? 'f' : 'c';
        updateUnitButtonUI();
    };

    const updateUnitButtonUI = () => {
        DOM.unitBtn.querySelectorAll('.unit-option').forEach((option) => {
            option.classList.toggle('active', option.getAttribute('data-unit') === unitPreference);
        });
    };

    // ==========================================================================
    // WEATHER-THEMED ACCENT OVERRIDES
    // ==========================================================================
    const getWeatherCondition = (code) => {
        if (code === 0) return 'clear';
        if (code >= 1 && code <= 3) return 'partly';
        if (code === 45 || code === 48) return 'fog';
        if ((code >= 51 && code <= 57) || (code >= 80 && code <= 82)) return 'drizzle';
        if (code >= 61 && code <= 67) return 'rain';
        if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return 'snow';
        if (code >= 95) return 'storm';
        return 'partly';
    };

    const UNSPLASH_PHOTOS = {
        'clear-1': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=2560&q=90&auto=format',
        'clear-0': 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=2560&q=90&auto=format',
        'partly-1': 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=2560&q=90&auto=format',
        'partly-0': 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=2560&q=90&auto=format',
        fog: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=2560&q=90&auto=format',
        drizzle: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=2560&q=90&auto=format',
        rain: 'https://images.unsplash.com/photo-1438449805896-28a666819a20?w=2560&q=90&auto=format',
        snow: 'https://images.unsplash.com/photo-1491002052546-bf38f186af56?w=2560&q=90&auto=format',
        storm: 'https://images.unsplash.com/photo-1471922694854-ff1b63b20054?w=2560&q=90&auto=format'
    };

    let photoLoadToken = 0;

    /**
     * Crossfades the page backdrop layer to a specific photo URL. Images are
     * preloaded before display and failures fall back to the gradient.
     */
    const showPhotoOnLayer = (url) => {
        const layer = document.querySelector('.bg-photo');
        if (!layer) return;
        if (!photoBackdropEnabled) {
            layer.classList.remove('visible');
            return;
        }
        const token = ++photoLoadToken;
        const probe = new Image();
        probe.onload = () => {
            if (token !== photoLoadToken) return;
            layer.style.backgroundImage = `url("${url}")`;
            layer.classList.add('visible');
        };
        probe.onerror = () => {
            if (token !== photoLoadToken) return;
            layer.classList.remove('visible');
        };

        layer.classList.remove('visible');
        probe.src = url;
    };

    const setBackgroundPhoto = (condition, isDay) => {
        if (slideshowEnabled) return;
        const key = (condition === 'clear' || condition === 'partly') ? `${condition}-${isDay}` : condition;
        const url = UNSPLASH_PHOTOS[key] || UNSPLASH_PHOTOS[condition] || null;
        if (!url) return;
        showPhotoOnLayer(url);
    };

    /**
     * Applies a background image with a shimmer placeholder while it loads
     */
    const applyBgImage = (el, url) => {
        if (!el) return;
        el.classList.add('img-shimmer');
        const probe = new Image();
        probe.onload = () => {
            el.style.backgroundImage = `url('${url}')`;
            el.classList.remove('img-shimmer');
        };
        probe.onerror = () => el.classList.remove('img-shimmer');
        probe.src = url;
    };

    const DAYLIGHT_PHOTOS = {
        day: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=2560&q=90&auto=format',
        night: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=2560&q=90&auto=format'
    };

    const applyWeatherCondition = (code, isDay = 1) => {
        const condition = getWeatherCondition(code);
        document.documentElement.setAttribute('data-weather', condition);
        setBackgroundPhoto(condition, isDay);
    };

    // ==========================================================================
    // AUDIO & HAPTIC FEEDBACK ENGINE
    // ==========================================================================
    let audioContext = null;

    const ensureAudioContext = () => {
        if (!audioContext) {
            const AudioCtor = window.AudioContext || window.webkitAudioContext;
            if (AudioCtor) audioContext = new AudioCtor();
        }
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
        return audioContext;
    };

    const playTone = (frequency, duration = 0.12, volume = 0.04, type = 'sine') => {
        if (feedbackMuted) return;
        try {
            const ctx = ensureAudioContext();
            if (!ctx) return;
            const oscillator = ctx.createOscillator();
            const gain = ctx.createGain();
            oscillator.type = type;
            oscillator.frequency.value = frequency;
            gain.gain.setValueAtTime(volume, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
            oscillator.connect(gain).connect(ctx.destination);
            oscillator.start();
            oscillator.stop(ctx.currentTime + duration);
        } catch (err) {
            // Audio playback is purely decorative; failures are ignored silently.
        }
    };

    const vibrate = (pattern) => {
        if (feedbackMuted) return;
        try {
            if (navigator.vibrate) navigator.vibrate(pattern);
        } catch (err) {
            // Haptics are unsupported in some clients; failures are ignored silently.
        }
    };

    const feedbackTones = {
        success: () => {
            playTone(660, 0.09, 0.035);
            setTimeout(() => playTone(880, 0.12, 0.035), 90);
        },
        error: () => {
            playTone(220, 0.16, 0.05, 'triangle');
            setTimeout(() => playTone(180, 0.2, 0.05, 'triangle'), 140);
        },
        toggle: () => playTone(520, 0.08, 0.03),
        favorite: () => {
            playTone(740, 0.09, 0.035);
            setTimeout(() => playTone(988, 0.14, 0.035), 100);
        },
        removed: () => {
            playTone(440, 0.1, 0.035);
            setTimeout(() => playTone(330, 0.14, 0.035), 100);
        },
        notify: () => playTone(600, 0.1, 0.03)
    };

    // ==========================================================================
    // INTERACTIVE CONTROLS (REFRESH, CLOCK, TRENDS, INSIGHTS)
    // ==========================================================================
    const refreshWeather = () => {
        DOM.refreshBtn.classList.add('spinning');
        if (!activeWeatherPayload) {
            searchWeather().finally(() => DOM.refreshBtn.classList.remove('spinning'));
            return;
        }
        const { lat, lon } = activeWeatherPayload.coordinates;
        showLoader();
        hideError();
        getWeather(lat, lon, activeWeatherPayload.displayName, activeWeatherPayload.cityName, true)
            .then(() => {
                feedbackTones.toggle();
                vibrate(10);
                fetchComparisonWeather();
            })
            .catch((err) => { feedbackTones.error(); showError(err.message); })
            .finally(() => { hideLoader(); DOM.refreshBtn.classList.remove('spinning'); });
    };

    const tickClock = () => {
        if (DOM.weatherDashboard.classList.contains('hidden')) return;
        const now = new Date();
        if (activeWeatherPayload && activeWeatherPayload.offset) {
            const cityTime = new Date(now.getTime() + activeWeatherPayload.offset * 1000);
            DOM.currentDateTime.textContent =
                `${cityTime.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })} | ` +
                `${cityTime.toLocaleTimeString('en-US', { timeZone: 'UTC', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })} (Local)`;
        } else {
            DOM.currentDateTime.textContent = `${formatDate(now)} | ${formatClockTime(now)}`;
        }
        if (lastFetchTimestamp) {
            DOM.lastUpdated.textContent = `Updated ${formatClockTime(new Date(lastFetchTimestamp))}`;
        }
        updateDaylightLive();
    };

    const formatClockTime = (dateObj) =>
        dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });

    const getCompassDirection = (deg) => {
        const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        return directions[Math.round(deg / 22.5) % 16];
    };

    const getWeatherInsight = (current, daily, aqi = null) => {
        const code = current.weather_code;
        const temp = current.temperature_2m;
        const uv = daily.uv_index_max ? daily.uv_index_max[0] : 0;
        if (code >= 95) return "Thunderstorms detected — stay indoors and avoid open areas.";
        if (code >= 71 && code <= 86) return "Snow is falling — drive carefully and dress warmly.";
        if (code >= 61 && code <= 67) return "Rain in progress — keep an umbrella handy.";
        if (code >= 80 && code <= 82) return "Scattered showers possible — an umbrella is a wise companion.";
        if (code >= 51 && code <= 57) return "Light drizzle outside — a light jacket should do.";
        if (code === 45 || code === 48) return "Fog is reducing visibility — take it slow on the roads.";
        if (code <= 3 && uv >= 6) return "Strong UV index — apply sunscreen and stay hydrated.";
        if (code <= 3 && temp >= 28) return "Hot and clear — stay cool and drink plenty of water.";
        if (code <= 3 && temp <= 5) return "Clear and crisp — the perfect weather for a warm drink.";
        if (aqi != null && aqi >= 101 && aqi <= 150) return "Air quality is unhealthy for sensitive groups — consider limiting outdoor time.";
        if (aqi != null && aqi > 150) return "Air quality is unhealthy — reduce outdoor exertion where possible.";
        return "Conditions look stable — enjoy your day outdoors.";
    };

    const renderTrendChart = (hourlyData) => {
        const svg = DOM.trendChart;
        if (!svg) return;
        const width = 600;
        const height = 120;
        const pad = 10;
        const currentHourIndex = new Date().getHours();
        const temps = [];
        for (let i = currentHourIndex; i < currentHourIndex + 24; i++) {
            if (hourlyData.temperature_2m[i] === undefined) break;
            temps.push(hourlyData.temperature_2m[i]);
        }
        if (temps.length < 2) {
            svg.innerHTML = '';
            return;
        }
        const min = Math.min(...temps);
        const max = Math.max(...temps);
        const range = (max - min) || 1;
        const x = (i) => pad + (i * (width - pad * 2)) / (temps.length - 1);
        const y = (t) => pad + (1 - (t - min) / range) * (height - pad * 2);
        const linePoints = temps.map((t, i) => `${x(i).toFixed(1)},${y(t).toFixed(1)}`).join(' L ');
        const linePath = `M ${linePoints}`;
        const areaPath = `${linePath} L ${x(temps.length - 1).toFixed(1)},${height - pad} L ${pad},${height - pad} Z`;

        svg.innerHTML = `
            <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" style="stop-color: var(--accent-color); stop-opacity: 0.35;"></stop>
                    <stop offset="1" style="stop-color: var(--accent-color); stop-opacity: 0.02;"></stop>
                </linearGradient>
            </defs>
            <path class="trend-area" d="${areaPath}" fill="url(#trendFill)"></path>
            <path class="trend-line" d="${linePath}" fill="none" style="stroke: var(--accent-color);" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path>
            <circle cx="${x(temps.length - 1).toFixed(1)}" cy="${y(temps[temps.length - 1]).toFixed(1)}" r="3.5" style="fill: var(--accent-color);"></circle>
        `;

        // Animate the line drawing itself
        const line = svg.querySelector('.trend-line');
        const totalLength = line.getTotalLength();
        line.style.strokeDasharray = totalLength;
        line.style.strokeDashoffset = totalLength;
        requestAnimationFrame(() => {
            line.style.transition = 'stroke-dashoffset 1.1s ease-out';
            line.style.strokeDashoffset = '0';
        });
    };

    // ==========================================================================
    // AIR QUALITY INDEX SUBSYSTEM
    // ==========================================================================
    const getAqiCategory = (value) => {
        if (value == null) return { label: '--', tone: 'none' };
        if (value <= 50) return { label: 'Good', tone: 'good' };
        if (value <= 100) return { label: 'Moderate', tone: 'moderate' };
        if (value <= 150) return { label: 'Unhealthy (Sensitive)', tone: 'unhealthy' };
        if (value <= 200) return { label: 'Unhealthy', tone: 'unhealthy' };
        if (value <= 300) return { label: 'Very Unhealthy', tone: 'very-unhealthy' };
        return { label: 'Hazardous', tone: 'hazardous' };
    };

    // ==========================================================================
    // DAYLIGHT ARC VISUALIZATION
    // ==========================================================================
    const renderDaylightArc = (dailyData) => {
        if (!dailyData.sunrise || !dailyData.sunrise[0]) return;
        daylightCache = {
            sunrise: new Date(dailyData.sunrise[0]).getTime(),
            sunset: new Date(dailyData.sunset[0]).getTime()
        };
        const nowMs = Date.now();
        applyBgImage(DOM.daylightPhoto, (nowMs >= daylightCache.sunrise && nowMs <= daylightCache.sunset) ? DAYLIGHT_PHOTOS.day : DAYLIGHT_PHOTOS.night);

        DOM.daylightSunrise.textContent = formatTime(dailyData.sunrise[0]);
        DOM.daylightSunset.textContent = formatTime(dailyData.sunset[0]);
        const durMs = daylightCache.sunset - daylightCache.sunrise;
        DOM.daylightDuration.textContent = formatDuration(durMs);
        DOM.daylightNoon.textContent = `Solar noon ${new Date(daylightCache.sunrise + durMs / 2).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
        updateDaylightLive();
    };

    const formatDuration = (ms) => {
        const totalMinutes = Math.max(0, Math.round(ms / 60000));
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        return `${hours}h ${mins.toString().padStart(2, '0')}m`;
    };

    const updateDaylightLive = () => {
        if (!daylightCache) return;
        const { sunrise, sunset } = daylightCache;
        const now = Date.now();
        let fraction = (now - sunrise) / (sunset - sunrise);
        const isDaylight = fraction >= 0 && fraction <= 1;
        fraction = Math.max(0, Math.min(1, fraction));

        // Sun position along the semicircular arc (left = sunrise, right = sunset)
        const cx = 110, cy = 95, r = 80;
        const angle = Math.PI - Math.PI * fraction;
        const sunX = cx + r * Math.cos(angle);
        const sunY = cy - r * Math.sin(angle);

        DOM.daylightTraveled.setAttribute('d', `M 30 95 A 80 80 0 0 1 ${sunX.toFixed(1)} ${sunY.toFixed(1)}`);
        DOM.daylightSun.setAttribute('cx', sunX.toFixed(1));
        DOM.daylightSun.setAttribute('cy', sunY.toFixed(1));
        DOM.daylightSun.style.opacity = isDaylight ? 1 : 0.35;

        let countdownText;
        if (now < sunrise) countdownText = `Sunrise in ${formatDuration(sunrise - now)}`;
        else if (now < sunset) countdownText = `Sunset in ${formatDuration(sunset - now)}`;
        else countdownText = `Next sunrise in ${formatDuration(sunrise + 86400000 - now)}`;
        DOM.daylightCountdown.textContent = countdownText;
    };

    // ==========================================================================
    // FEEDBACK MUTE CONTROL
    // ==========================================================================
    const toggleFeedbackMute = () => {
        feedbackMuted = !feedbackMuted;
        localStorage.setItem('wpro_sound_muted', feedbackMuted ? '1' : '0');
        DOM.muteBtn.classList.toggle('muted', feedbackMuted);
        updateFeedbackIcon();
        if (!feedbackMuted) {
            feedbackTones.toggle();
            vibrate(10);
        }
    };

    const loadFeedbackPref = () => {
        feedbackMuted = localStorage.getItem('wpro_sound_muted') === '1';
        DOM.muteBtn.classList.toggle('muted', feedbackMuted);
        updateFeedbackIcon();
    };

    const updateFeedbackIcon = () => {
        DOM.muteBtn.innerHTML = feedbackMuted
            ? '<i class="fa-solid fa-volume-xmark"></i>'
            : '<i class="fa-solid fa-volume-high"></i>';
    };

    // ==========================================================================
    // THEME PALETTE SYSTEM
    // ==========================================================================
    const applyPalette = (palette) => {
        document.documentElement.setAttribute('data-palette', palette);
        localStorage.setItem('wpro_palette', palette);
        document.querySelectorAll('.palette-swatch').forEach((sw) => {
            sw.classList.toggle('active', sw.getAttribute('data-palette') === palette);
        });
    };

    const loadPalette = () => {
        applyPalette(localStorage.getItem('wpro_palette') || 'ember');
    };

    const selectPalette = (palette) => {
        applyPalette(palette);
        feedbackTones.toggle();
        vibrate(10);
    };

    // ==========================================================================
    // PHOTO BACKDROP CONTROL
    // ==========================================================================
    const SLIDESHOW_POOL = [
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=2560&q=90&auto=format',
        'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=2560&q=90&auto=format',
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=2560&q=90&auto=format',
        'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=2560&q=90&auto=format',
        'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=2560&q=90&auto=format',
        'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=2560&q=90&auto=format',
        'https://images.unsplash.com/photo-1438449805896-28a666819a20?w=2560&q=90&auto=format',
        'https://images.unsplash.com/photo-1491002052546-bf38f186af56?w=2560&q=90&auto=format',
        'https://images.unsplash.com/photo-1471922694854-ff1b63b20054?w=2560&q=90&auto=format',
        'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=2560&q=90&auto=format',
        'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=2560&q=90&auto=format',
        'https://images.unsplash.com/photo-1487621167305-5d248087c724?w=2560&q=90&auto=format',
        'https://images.unsplash.com/photo-1517299321609-52687d1bc55a?w=2560&q=90&auto=format',
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=2560&q=90&auto=format',
        'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=2560&q=90&auto=format',
        'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=2560&q=90&auto=format'
    ];

    const slideshowStep = () => {
        if (!slideshowEnabled) return;
        slideshowIndex = (slideshowIndex + 1) % SLIDESHOW_POOL.length;
        showPhotoOnLayer(SLIDESHOW_POOL[slideshowIndex]);
    };

    const startSlideshow = () => {
        stopSlideshow();
        slideshowTimer = setInterval(slideshowStep, 45000);
    };

    const stopSlideshow = () => {
        if (slideshowTimer) {
            clearInterval(slideshowTimer);
            slideshowTimer = null;
        }
    };

    const toggleSlideshow = () => {
        slideshowEnabled = !slideshowEnabled;
        localStorage.setItem('wpro_slideshow', slideshowEnabled ? '1' : '0');
        DOM.slideshowToggle.classList.toggle('on', slideshowEnabled);
        DOM.slideshowToggle.setAttribute('aria-checked', slideshowEnabled);
        if (slideshowEnabled) {
            slideshowIndex = 0;
            showPhotoOnLayer(SLIDESHOW_POOL[0]);
            startSlideshow();
        } else {
            stopSlideshow();
            if (activeWeatherPayload) {
                applyWeatherCondition(activeWeatherPayload.raw.current.weather_code, activeWeatherPayload.raw.current.is_day);
            }
        }
        feedbackTones.toggle();
        vibrate(10);
    };

    const loadSlideshowPref = () => {
        slideshowEnabled = localStorage.getItem('wpro_slideshow') === '1';
        DOM.slideshowToggle.classList.toggle('on', slideshowEnabled);
        DOM.slideshowToggle.setAttribute('aria-checked', slideshowEnabled);
        if (slideshowEnabled) startSlideshow();
    };

    const togglePhotoBackdrop = () => {
        photoBackdropEnabled = !photoBackdropEnabled;
        localStorage.setItem('wpro_backdrop', photoBackdropEnabled ? '1' : '0');
        DOM.backdropToggle.classList.toggle('on', photoBackdropEnabled);
        DOM.backdropToggle.setAttribute('aria-checked', photoBackdropEnabled);
        if (!photoBackdropEnabled) {
            slideshowEnabled = false;
            stopSlideshow();
            DOM.slideshowToggle.classList.remove('on');
            DOM.slideshowToggle.setAttribute('aria-checked', 'false');
        } else if (activeWeatherPayload) {
            applyWeatherCondition(activeWeatherPayload.raw.current.weather_code, activeWeatherPayload.raw.current.is_day);
        }
        feedbackTones.toggle();
        vibrate(10);
    };

    const loadBackdropPref = () => {
        photoBackdropEnabled = localStorage.getItem('wpro_backdrop') !== '0';
        DOM.backdropToggle.classList.toggle('on', photoBackdropEnabled);
        DOM.backdropToggle.setAttribute('aria-checked', photoBackdropEnabled);
        if (!photoBackdropEnabled) {
            slideshowEnabled = false;
            stopSlideshow();
            DOM.slideshowToggle.classList.remove('on');
            DOM.slideshowToggle.setAttribute('aria-checked', 'false');
        }
    };

    // ==========================================================================
    // MULTI-CITY COMPARISON SUBSYSTEM
    // ==========================================================================
    const CITY_PHOTOS = [
        'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1280&q=85&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1280&q=85&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1280&q=85&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1280&q=85&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=1280&q=85&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1494526585095-c41746248156?w=1280&q=85&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1490644658840-3f2e3f8c5625?w=1280&q=85&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1280&q=85&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1449034446853-66c86144b0ad?w=1280&q=85&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1280&q=85&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1280&q=85&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1280&q=85&auto=format&fit=crop'
    ];

    const getCityPhoto = (name) => {
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
        return CITY_PHOTOS[hash % CITY_PHOTOS.length];
    };

    const saveComparison = () => {
        localStorage.setItem('wpro_compare', JSON.stringify(
            comparisonCities.map(({ displayName, lat, lon }) => ({ displayName, lat, lon }))
        ));
    };

    const addComparisonCity = async (query) => {
        const target = String(query || '').trim();
        if (!target) return;
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(target)}&count=1&language=en&format=json`;
        try {
            const geoResponse = await fetch(geoUrl);
            if (!geoResponse.ok) throw new Error("Geocoding failure.");
            const geoData = await geoResponse.json();
            if (!geoData.results || geoData.results.length === 0) {
                showToast(`Could not locate "${target}".`);
                return;
            }
            const loc = geoData.results[0];
            const displayName = `${loc.name}${loc.admin1 ? ', ' + loc.admin1 : ''}`;
            if (comparisonCities.some((c) => c.displayName.toLowerCase() === displayName.toLowerCase())) {
                showToast(`${displayName} is already in the comparison.`);
                return;
            }
            comparisonCities.push({ displayName, lat: loc.latitude, lon: loc.longitude, tempC: null, code: null, isDay: 1 });
            if (comparisonCities.length > 6) comparisonCities.shift();
            saveComparison();
            DOM.compareInput.value = "";
            await fetchComparisonWeather();
            feedbackTones.success();
            vibrate(15);
        } catch (err) {
            feedbackTones.error();
            showToast("Could not add that city — try again.");
        }
    };

    const fetchComparisonWeather = async () => {
        if (comparisonCities.length === 0) {
            renderComparison();
            return;
        }
        const results = await Promise.all(comparisonCities.map(async (city) => {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,weather_code,is_day&timezone=auto`;
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error();
                const data = await response.json();
                return {
                    ...city,
                    tempC: data.current.temperature_2m,
                    code: data.current.weather_code,
                    isDay: data.current.is_day
                };
            } catch (err) {
                return { ...city, tempC: null, code: null, isDay: 1 };
            }
        }));
        comparisonCities = results;
        saveComparison();
        renderComparison();
    };

    const renderComparison = () => {
        DOM.compareGrid.innerHTML = "";
        if (comparisonCities.length === 0) {
            DOM.compareGrid.innerHTML = '<div class="empty-state"><i class="fa-solid fa-layer-group"></i><span>Add cities above to compare them side by side.</span></div>';
            return;
        }
        comparisonCities.forEach((city, index) => {
            const card = document.createElement('div');
            card.className = 'compare-card rise-item';
            card.style.animationDelay = `${index * 0.06}s`;

            const isActive = activeWeatherPayload && city.displayName.toLowerCase() === activeWeatherPayload.cityName.toLowerCase();
            if (isActive) card.classList.add('active');

            const tempText = city.tempC != null ? `${convertTemp(city.tempC)}${unitSymbol()}` : '--';
            const iconClass = city.code != null ? getWeatherIcon(city.code, city.isDay) : 'fa-cloud';
            const desc = city.code != null ? getWeatherDescription(city.code) : 'Unavailable';

            card.innerHTML = `
                <div class="compare-photo"></div>
                <span class="compare-remove" title="Remove from comparison"><i class="fa-solid fa-xmark"></i></span>
                <div class="compare-body">
                    <div class="compare-head">
                        <i class="fa-solid ${iconClass} compare-icon"></i>
                        <span class="compare-city">${city.displayName}</span>
                    </div>
                    <span class="compare-temp">${tempText}</span>
                    <span class="compare-desc">${desc}</span>
                </div>
            `;
            applyBgImage(card.querySelector('.compare-photo'), getCityPhoto(city.displayName));

            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', '0');
            card.setAttribute('aria-label', `Open weather for ${city.displayName}`);

            card.querySelector('.compare-remove').addEventListener('click', (e) => {
                e.stopPropagation();
                removeComparisonCity(city.displayName);
            });
            card.addEventListener('click', () => searchWeather(city.displayName));
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    card.click();
                }
            });
            DOM.compareGrid.appendChild(card);
        });
    };

    const removeComparisonCity = (name) => {
        const removed = comparisonCities.find((c) => c.displayName.toLowerCase() === name.toLowerCase());
        comparisonCities = comparisonCities.filter((c) => c.displayName.toLowerCase() !== name.toLowerCase());
        saveComparison();
        renderComparison();
        feedbackTones.removed();
        vibrate(10);
        if (removed) {
            showToast(`Removed ${name} from comparison.`, () => {
                comparisonCities.push(removed);
                saveComparison();
                renderComparison();
                feedbackTones.toggle();
            });
        }
    };

    const loadComparison = () => {
        const cached = localStorage.getItem('wpro_compare');
        comparisonCities = cached ? JSON.parse(cached) : [];
        fetchComparisonWeather();
    };

    // ==========================================================================
    // FORECAST EXTREMES SUMMARY
    // ==========================================================================
    const renderExtremes = (dailyData) => {
        const days = [];
        for (let i = 1; i < 15; i++) {
            if (!dailyData.time[i]) break;
            days.push({
                date: dailyData.time[i],
                minRaw: dailyData.temperature_2m_min[i],
                maxRaw: dailyData.temperature_2m_max[i],
                code: dailyData.weather_code[i]
            });
        }
        if (days.length === 0) return;

        const hottest = days.reduce((a, b) => (b.maxRaw > a.maxRaw ? b : a));
        const coldest = days.reduce((a, b) => (b.minRaw < a.minRaw ? b : a));

        DOM.extremeHotDate.textContent = formatDate(hottest.date, true);
        DOM.extremeHotTemp.textContent = `${convertTemp(hottest.maxRaw)}${unitSymbol()}`;
        DOM.extremeHotIcon.className = `fa-solid ${getWeatherIcon(hottest.code, 1)}`;
        DOM.extremeHotDesc.textContent = getWeatherDescription(hottest.code);

        DOM.extremeColdDate.textContent = formatDate(coldest.date, true);
        DOM.extremeColdTemp.textContent = `${convertTemp(coldest.minRaw)}${unitSymbol()}`;
        DOM.extremeColdIcon.className = `fa-solid ${getWeatherIcon(coldest.code, 1)}`;
        DOM.extremeColdDesc.textContent = getWeatherDescription(coldest.code);
    };

    // ==========================================================================
    // FORECAST SHARING
    // ==========================================================================
    const buildShareText = () => {
        if (!activeWeatherPayload) return null;
        const { displayName, aqi, raw } = activeWeatherPayload;
        const current = raw.current;
        const daily = raw.daily;
        const lines = [];
        lines.push(`🌤 Weather App Pro — ${displayName}`);
        lines.push(`${formatDate(new Date())} · ${getWeatherDescription(current.weather_code)} · ${convertTemp(current.temperature_2m)}${unitSymbol()} (feels ${convertTemp(current.apparent_temperature)}${unitSymbol()})`);
        lines.push(`💧 Humidity ${current.relative_humidity_2m}% · 💨 Wind ${current.wind_speed_10m.toFixed(1)} km/h · 🧭 ${getCompassDirection(current.wind_direction_10m || 0)}`);
        if (aqi != null) lines.push(`🍃 Air Quality (US AQI): ${aqi} — ${getAqiCategory(aqi).label}`);
        lines.push(`☀️ Sunrise ${formatTime(daily.sunrise[0])} · Sunset ${formatTime(daily.sunset[0])}`);
        const outlook = [];
        for (let i = 1; i < 15; i++) {
            if (!daily.time[i]) break;
            outlook.push(`${formatDate(daily.time[i], true)} ${convertTemp(daily.temperature_2m_max[i])}°/${convertTemp(daily.temperature_2m_min[i])}° ${getWeatherDescription(daily.weather_code[i])}`);
        }
        if (outlook.length) lines.push(`📅 Outlook: ${outlook.join(' | ')}`);
        lines.push('— shared via Weather App Pro');
        return lines.join('\n');
    };

    const shareForecast = async () => {
        const text = buildShareText();
        if (!text) {
            showToast("Load a forecast before sharing.");
            return;
        }
        try {
            await navigator.clipboard.writeText(text);
            showToast("Forecast copied to clipboard.");
        } catch (err) {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                showToast("Forecast copied to clipboard.");
            } catch (err2) {
                showToast("Could not copy forecast.");
            }
            document.body.removeChild(textArea);
        }
        feedbackTones.toggle();
        vibrate(10);
    };

    const exportForecastData = () => {
        if (!activeWeatherPayload) {
            showToast("Load a forecast before exporting.");
            return;
        }
        const data = {
            exportedAt: new Date().toISOString(),
            location: activeWeatherPayload.displayName,
            coordinates: activeWeatherPayload.coordinates,
            airQuality: activeWeatherPayload.aqi,
            weather: activeWeatherPayload.raw
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `weather-${activeWeatherPayload.cityName.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast("Forecast data exported.");
        feedbackTones.toggle();
        vibrate(10);
    };

    // ==========================================================================
    // CITY SEARCH AUTOCOMPLETE
    // ==========================================================================
    const handleCityInput = () => {
        clearTimeout(suggestionDebounce);
        const query = DOM.cityInput.value.trim();
        if (query.length < 2) {
            hideSuggestions();
            return;
        }
        suggestionDebounce = setTimeout(() => fetchSuggestions(query), 250);
    };

    const fetchSuggestions = async (query) => {
        try {
            const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`);
            if (!response.ok) throw new Error();
            const data = await response.json();
            if (DOM.cityInput.value.trim() !== query) return; // stale response
            suggestionItems = (data.results || []).map((r) => ({
                name: r.name,
                display: `${r.name}${r.admin1 ? ', ' + r.admin1 : ''}${r.country ? ', ' + r.country : ''}`
            }));
            suggestionIndex = -1;
            renderSuggestions();
        } catch (err) {
            hideSuggestions();
        }
    };

    const renderSuggestions = () => {
        DOM.suggestions.innerHTML = '';
        if (!suggestionItems.length) {
            hideSuggestions();
            return;
        }
        suggestionItems.forEach((item, idx) => {
            const el = document.createElement('div');
            el.className = 'suggestion-item';
            el.setAttribute('role', 'option');
            el.innerHTML = `<i class="fa-solid fa-location-dot"></i><span>${item.display}</span>`;
            el.addEventListener('mousedown', (e) => {
                e.preventDefault();
                DOM.cityInput.value = item.name;
                hideSuggestions();
                searchWeather(item.name);
            });
            el.addEventListener('mouseenter', () => {
                suggestionIndex = idx;
                updateSuggestionHighlight();
            });
            DOM.suggestions.appendChild(el);
        });
        DOM.suggestions.classList.remove('hidden');
        updateSuggestionHighlight();
    };

    const moveSuggestionHighlight = (dir) => {
        if (!suggestionItems.length) return;
        suggestionIndex = (suggestionIndex + dir + suggestionItems.length) % suggestionItems.length;
        updateSuggestionHighlight();
        const active = DOM.suggestions.children[suggestionIndex];
        if (active) active.scrollIntoView({ block: 'nearest' });
    };

    const updateSuggestionHighlight = () => {
        Array.from(DOM.suggestions.children).forEach((el, idx) => {
            el.classList.toggle('highlighted', idx === suggestionIndex);
        });
    };

    const hideSuggestions = () => {
        suggestionItems = [];
        suggestionIndex = -1;
        DOM.suggestions.classList.add('hidden');
        DOM.suggestions.innerHTML = '';
    };

    // ==========================================================================
    // SCROLL-TO-TOP CONTROL
    // ==========================================================================
    const toggleScrollTopButton = () => {
        const show = window.scrollY > 420;
        DOM.scrollTopBtn.classList.toggle('hidden', !show);
    };

    // ==========================================================================
    // PROGRESSIVE WEB APP (SERVICE WORKER)
    // ==========================================================================
    const registerServiceWorker = () => {
        if (!('serviceWorker' in navigator)) return;
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js').catch(() => {
                // Registration fails on file:// or unsupported contexts; app works regardless
            });
        });
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
