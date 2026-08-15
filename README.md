# Weather App Pro

## Live Demo

https://weather-app-pro-noors.netlify.app/

Weather App Pro is a modern, high-fidelity responsive dashboard application constructed utilizing purely standard native platform web structures. Built using clean, semantic components and structured without relying on dependencies or secondary third-party frameworks.

The visual layout employs a modern glassmorphism aesthetic over a warm **ember-and-ivory palette** (copper, amber and cream tones) with fluid ambient background gradients. It incorporates responsive adaptivity, rich entrance and hover motion choreography, dark/light context toggles, and unified interface states.

## Features

- **Global Address Lookup Engine**: Seamless text routing resolves geographical regions via standard Geocoding indexing.
- **Hardware Telemetry Resolution**: Accesses system location data coordinates instantly through standard Web Browser Geolocation APIs.
- **Asynchronous Data Layer Orchestration**: Consumes public weather platforms safely via modern `async/await` and native `fetch` structures.
- **Deep Technical Metrics Visualization**: Tracks metrics beyond basic temperatures including Apparent Thermal Values ("Feels Like"), Relative Humidities, Surface Wind Velocities, Pressures, Visual Transparency Ranges, UV-Exposure ratings, alongside precise Dawn and Dusk timestamps.
- **Micro-Timeline Aggregation**: Renders granular hourly forecasts for the upcoming 24-hour cycle.
- **Macro Forecasting Profiles**: Projects extended outlook tracking metrics across a 14-day window with temperature comparison bars (each day's min/max range visualized against the window's bounds) and a **Forecast Extremes** summary highlighting the warmest and coldest days.
- **Dynamic Persistent Memory States**: Search parameters, preferred locations lists, and appearance configuration states persist seamlessly via client-side LocalStorage layers.
- **Adaptive Appearance Modes**: Supports light mode and dark mode with localized visual configurations.
- **Motion & Transition Design**: Staggered entrance choreography, drifting ambient background orbs, numeric count-up transitions, and smooth interactive hover states (with `prefers-reduced-motion` support).
- **Weather-Mirrored Accents**: The warm palette subtly shifts with the current sky conditions — golden amber for clear skies, clay for drizzle, deep rust for rain, warm pearl for snow, crimson for storms, and taupe for fog.
- **Adaptive Unit Switching**: One-tap °C / °F conversion that updates the hero temperature, feels-like, hourly timeline, and 5-day range instantly (persisted locally).
- **Sensory Feedback Layer**: Subtle audio chimes (Web Audio API, no assets) and haptic pulses confirm searches, favorites, theme toggles, and errors.
- **Live 24-Hour Temperature Trend**: An animated SVG sparkline draws the next 24 hours of temperature under the hourly timeline.
- **Deep Wind Telemetry**: Wind direction rendered as a rotating compass arrow with cardinal labels, plus live gust speeds.
- **Expanded Atmospheric Matrix**: Cloud cover and dew point join the metrics grid, and every hourly card and 5-day row now shows precipitation probability.
- **Smart Weather Insights**: A contextual advice strip (UV alerts, rain/snow warnings, heat/cold tips) updates with each forecast.
- **Manual Refresh & Quick Search**: A refresh button re-fetches the active location, and pressing `/` or `Ctrl+K` jumps straight to the city search.
- **Live System Clock**: The hero card ticks in real time with seconds precision.
- **Custom Favicon**: A branded ember-gradient sun-and-cloud SVG favicon.
- **Daylight Arc Visualization**: An animated sunrise-to-sunset arc with a live sun position marker, daylight duration, and solar noon readout.
- **Air Quality Index**: A live US AQI tile (with category coloring and air-quality-aware insights) fed from the Open-Meteo air quality API.
- **Feedback Mute Control**: A header toggle silences all audio chimes and haptic pulses (persisted locally).
- **Selectable Theme Palettes**: Four warm, distinct identities — Ember & Ivory (default), Rosewood & Blush, Cocoa & Caramel, and Charcoal & Gold — each with tuned light and dark variants, switchable from the control panel.
- **Multi-City Comparison**: Add up to 6 cities to compare current conditions side by side; the active city is highlighted, cards are clickable to switch focus, and data refreshes with the main refresh button.
- **Forecast Sharing**: One tap copies a formatted weather summary (current conditions, AQI, sunrise/sunset, and 14-day outlook) to the clipboard.
- **JSON Export**: Download the full raw forecast payload as a formatted JSON file for offline analysis.
- **City-Local Clock**: The hero card shows the searched city's true local time (via the API timezone offset), alongside the last-updated timestamp.
- **Rich Hourly Cards**: Each hour now shows wind speed, precipitation probability, and rainfall amount in addition to temperature.
- **Pressure Trend**: The pressure tile reports whether the barometer is rising, falling, or steady versus three hours ago.
- **Live Daylight Countdown**: The daylight panel ticks down to sunset (or the next sunrise) and the sun marker updates in real time.
- **Error Retry & Shortcuts**: Failed fetches offer a one-click retry button; `Esc` clears any focused search input.
- **Unsplash HD Photo Backdrops**: The page backdrop crossfades to a curated Unsplash photo (served at 2560px HD with optimized encoding) matched to the live sky condition (sunny, starry night, rain, snow, storms, fog…), preloaded and gracefully falling back to the gradient if an image fails to load.
- **Palette-Tinted Photos**: Every palette and theme applies a subtle color wash over the backdrop so imagery always harmonizes with the active theme.
- **Backdrop Toggle & Slideshow**: Switches in the control panel turn the photo backdrop on/off and enable a 45-second HD slideshow that rotates through 16 curated Unsplash landscapes (all persisted locally).
- **City Card Photos**: The hero card, every multi-city comparison card, and every favorite/recent-search chip show curated Unsplash city photos at 1280px HD, picked deterministically per city.
- **Daylight Photo Strip**: The daylight panel shows a golden-hour photo by day and a starry night photo after dark.
- **Full-Width City Banner**: A prominent 190px HD photo banner tops the display panel, showing the active city's image with a shimmer placeholder and a palette-tinted fade.

## Polish Layer

- **City Search Autocomplete**: Debounced live suggestions from the geocoding API with full keyboard navigation (↑/↓ + Enter, Esc to dismiss).
- **Shareable Deep Links**: The URL keeps `?city=Name`, so a link opens the exact same forecast.
- **Yesterday Deltas**: The hero card reports whether today is warmer or cooler than yesterday.
- **Smart Caching**: Forecast payloads are cached for 10 minutes (per city) so reloads are instant; the refresh button forces a live fetch.
- **Undo Everywhere**: Removed favorites, history entries, and comparison cities can be restored with a one-click Undo toast.
- **PWA Installable**: A manifest + service worker make the app installable with offline support (cache-first shell, network-first APIs).
- **Scroll-to-Top**: A floating button appears after scrolling down the dashboard.
- **Print Stylesheet**: A clean, ink-friendly layout for printing any forecast.
- **Accessibility**: `aria-live` toasts, `role="alert"` errors, and full keyboard navigation across chips, comparison cards, and suggestions.
- **Illustrated Empty States**: Favorites, history, and comparison now show icon-based placeholders.
- **Fluid Responsive Layout**: A refined multi-tier responsive system — a fluid sidebar (`minmax`), a **tablet tier** (≤1024px) that reflows the control panel into a tidy 2-column grid, a compact phone tier, a very-small-phone tier (≤380px), a landscape-phone tier for short viewports, touch-device hover handling (`hover: none` so cards don't stay raised after a tap), fluid `clamp()` typography for the giant metrics and city banner, a wrapping header with larger touch targets, snap-scrolling hourly cards, and a full-width toast on narrow screens — so the dashboard adapts smoothly from ultrawide monitors down to 320px phones.
- **Shimmer Placeholders**: Every photo surface (backdrops, hero, chips, comparison cards, daylight strip) shows an animated shimmer while its HD image loads — no more blank flashes.
- **Photo Credits**: The footer attributes backdrop photography to Unsplash with a direct link.
- **Integrated Application Notifications**: Real-time validation updates are surfaced through lightweight, smooth, self-clearing toast alerts.

## Technologies Used

- **Markup Foundation**: Semantic HTML5 layout architecture.
- **Styles Framework**: Modern CSS3 utilizing custom properties (CSS variables), Flexbox structures, CSS Grid engines, glassmorphism design parameters, and media queries.
- **Application Control Layer**: Vanilla JavaScript (ECMAScript 6 Standard) encapsulated via Immediately Invoked Function Expressions (IIFE).
- **Icon Assets**: Labeled vector glyph distributions via font-awesome frameworks.
- **Typography**: Poppins font types sourced safely via Google Web Fonts engines.

## Installation

1. Clone or download the source repository files containing: `index.html`, `style.css`, and `script.js`.
2. Ensure all 3 resource modules reside unified together inside an identical system directory path level:
