import { useEffect, useRef, useState, useCallback } from 'react';
import styles from './Weather.module.css';

/* ── Static data ─────────────────────────────────────────── */
const WMO = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Icy fog',
  51: 'Light drizzle', 53: 'Drizzle', 55: 'Dense drizzle',
  61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
  71: 'Light snow', 73: 'Snow', 75: 'Heavy snow',
  80: 'Showers', 81: 'Showers', 82: 'Heavy showers',
  95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm',
};
const ICON = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌧️',
  61: '🌧️', 63: '🌧️', 65: '🌧️',
  71: '🌨️', 73: '❄️', 75: '❄️',
  80: '🌦️', 81: '🌦️', 82: '⛈️',
  95: '⛈️', 96: '⛈️', 99: '⛈️',
};
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/* ── Helpers ─────────────────────────────────────────────── */
const ic   = (c) => ICON[c] || '🌡️';
const desc = (c) => WMO[c]  || '';
const toF  = (c) => Math.round(c * 9 / 5 + 32);
const windDir = (deg) => ['N','NE','E','SE','S','SW','W','NW'][Math.round(deg / 45) % 8];
const uvLabel = (v) => {
  if (v == null) return '';
  if (v <= 2)  return 'Low';
  if (v <= 5)  return 'Moderate';
  if (v <= 7)  return 'High';
  if (v <= 10) return 'Very high';
  return 'Extreme';
};

const LoadingDots = () => (
  <span className={styles.dots}><span>.</span><span>.</span><span>.</span></span>
);

export default function Weather() {
  const [cel, setCel]               = useState(true);
  const [wxData, setWxData]         = useState(null);
  const [cityName, setCityName]     = useState('');
  const [countryName, setCountry]   = useState('');
  const [query, setQuery]           = useState('');
  const [suggestions, setSugs]      = useState(null); // null = hidden
  const [selectedDay, setSelectedDay] = useState(null);
  const [loadingMsg, setLoadingMsg] = useState('Fetching your location');
  const [errorMsg, setErrorMsg]     = useState(null);

  const fmt = useCallback((c) => (cel ? Math.round(c) : toF(c)), [cel]);
  const u   = useCallback(() => (cel ? '°C' : '°F'), [cel]);

  const sugTimer   = useRef(null);
  const wrapRef    = useRef(null);

  /* ── Fetchers ──────────────────────────────────────────── */
  const loadWeather = useCallback(async (lat, lon, city, country) => {
    setCityName(city);
    setCountry(country);
    setWxData(null);
    setErrorMsg(null);
    setSelectedDay(null);
    setLoadingMsg('Loading weather');
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,precipitation,precipitation_probability,visibility,pressure_msl&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max&timezone=auto&forecast_days=7`;
      const r = await fetch(url);
      const d = await r.json();
      setWxData(d);
    } catch {
      setErrorMsg('Could not load weather data.');
    }
  }, []);

  const reverseGeo = useCallback(async (lat, lon) => {
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
      const d = await r.json();
      const city = d.address?.city || d.address?.town || d.address?.village || d.address?.county || 'Unknown';
      return [city, d.address?.country || ''];
    } catch {
      return ['Your location', ''];
    }
  }, []);

  const useGPS = useCallback(() => {
    if (!navigator.geolocation) {
      loadWeather(37.9838, 23.7275, 'Athens', 'Greece');
      return;
    }
    setLoadingMsg('Getting your location');
    setWxData(null);
    setErrorMsg(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        const [city, country] = await reverseGeo(lat, lon);
        loadWeather(lat, lon, city, country);
      },
      () => loadWeather(37.9838, 23.7275, 'Athens', 'Greece')
    );
  }, [loadWeather, reverseGeo]);

  const selectLocation = useCallback((loc) => {
    setQuery(loc.name);
    setSugs(null);
    loadWeather(loc.latitude, loc.longitude, loc.name, loc.country || '');
  }, [loadWeather]);

  const fetchSuggestions = useCallback(async (q, pickFirst = false) => {
    try {
      const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=en&format=json`);
      const d = await r.json();
      if (!d.results?.length) {
        if (pickFirst) return;
        setSugs([]);
        return;
      }
      if (pickFirst) {
        selectLocation(d.results[0]);
        return;
      }
      setSugs(d.results);
    } catch { /* silent */ }
  }, [selectLocation]);

  /* ── Boot ──────────────────────────────────────────────── */
  useEffect(() => { useGPS(); }, [useGPS]);

  /* ── Outside-click closes suggestions ──────────────────── */
  useEffect(() => {
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setSugs(null);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  /* ── Search handlers ───────────────────────────────────── */
  const onSearchInput = (e) => {
    const v = e.target.value;
    setQuery(v);
    clearTimeout(sugTimer.current);
    const q = v.trim();
    if (q.length < 2) { setSugs(null); return; }
    sugTimer.current = setTimeout(() => fetchSuggestions(q), 320);
  };
  const onSearchKey = (e) => {
    if (e.key === 'Enter') {
      const q = query.trim();
      if (q) fetchSuggestions(q, true);
    } else if (e.key === 'Escape') {
      setSugs(null);
    }
  };

  /* ── Forecast click (toggle) ───────────────────────────── */
  const toggleDay = (i) => setSelectedDay((prev) => (prev === i ? null : i));

  /* ── Derived render data ───────────────────────────────── */
  let renderData = null;
  if (wxData) {
    const c = wxData.current, d = wxData.daily, h = wxData.hourly;
    const now = new Date();
    const nowHour = now.getHours();

    let hStart = h.time.findIndex((t) => {
      const dt = new Date(t);
      return dt.toDateString() === now.toDateString() && dt.getHours() >= nowHour;
    });
    if (hStart < 0) hStart = 0;

    const hSlice = h.time.slice(hStart, hStart + 12).map((t, i) => {
      const idx = hStart + i;
      const dt = new Date(t);
      return {
        label: i === 0 ? 'Now' : dt.getHours().toString().padStart(2, '0') + ':00',
        code:  h.weather_code[idx],
        temp:  h.temperature_2m[idx],
        rain:  h.precipitation_probability[idx] || 0,
        isNow: i === 0,
      };
    });

    const forecast = d.time.map((dt, i) => {
      const day = new Date(dt + 'T12:00:00');
      return {
        name: i === 0 ? 'Today' : DAYS[day.getDay()],
        code: d.weather_code[i],
        hi:   d.temperature_2m_max[i],
        lo:   d.temperature_2m_min[i],
        i,
      };
    });

    const uvVal = d.uv_index_max ? d.uv_index_max[0] : null;
    const vis = c.visibility != null ? Math.round(c.visibility / 1000) + ' km' : '–';
    const rainChance = c.precipitation_probability != null
      ? c.precipitation_probability
      : (h.precipitation_probability[hStart] || 0);

    renderData = { c, d, h, hSlice, forecast, uvVal, vis, rainChance };
  }

  /* ── Day-detail slice ──────────────────────────────────── */
  let dayDetail = null;
  if (renderData && selectedDay != null) {
    const { d, h } = renderData;
    const i = selectedDay;
    const dateStr = d.time[i];
    const dayStart = h.time.findIndex((t) => t.startsWith(dateStr));
    const slice = dayStart >= 0 ? h.time.slice(dayStart, dayStart + 24) : [];
    const hours = slice.map((t, j) => {
      const idx = dayStart + j;
      return {
        hour: new Date(t).getHours().toString().padStart(2, '0') + ':00',
        code: h.weather_code[idx],
        temp: h.temperature_2m[idx],
        rain: h.precipitation_probability[idx] || 0,
      };
    });
    const day = new Date(dateStr + 'T12:00:00');
    const name = i === 0
      ? 'Today'
      : DAYS[day.getDay()] + ', ' + day.toLocaleDateString('en', { month: 'short', day: 'numeric' });
    const uv = d.uv_index_max ? d.uv_index_max[i] : null;
    dayDetail = {
      name,
      code: d.weather_code[i],
      hi:   d.temperature_2m_max[i],
      lo:   d.temperature_2m_min[i],
      uv,
      hours,
    };
  }

  /* ── Render ────────────────────────────────────────────── */
  return (
    <div className={styles.weather}>
      <div className={styles.header}>
        <div className={styles.tag}>// MODULE_04</div>
        <h2 className={styles.title}>
          WEATHER
        </h2>
        <p className={styles.sub}>Live conditions & 7-day forecast.</p>
      </div>

      {/* Search */}
      <div className={styles.searchWrap} ref={wrapRef}>
        <div className={styles.searchRow}>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="SEARCH ANY CITY…"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={onSearchInput}
            onKeyDown={onSearchKey}
          />
          <button className={styles.btn} onClick={useGPS}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="8" cy="8" r="2.5" />
              <line x1="8" y1="1" x2="8" y2="4" />
              <line x1="8" y1="12" x2="8" y2="15" />
              <line x1="1" y1="8" x2="4" y2="8" />
              <line x1="12" y1="8" x2="15" y2="8" />
            </svg>
            MY LOCATION
          </button>
        </div>

        {suggestions !== null && (
          <div className={styles.suggestions}>
            {suggestions.length === 0 ? (
              <div className={styles.sugEmpty}>No results found</div>
            ) : (
              suggestions.map((loc, idx) => (
                <div
                  key={`${loc.latitude}-${loc.longitude}-${idx}`}
                  className={styles.sug}
                  onClick={() => selectLocation(loc)}
                >
                  <span>{loc.name}{loc.admin1 ? ', ' + loc.admin1 : ''}</span>
                  <span className={styles.sugCountry}>{loc.country || ''}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {!wxData && !errorMsg && (
        <div className={styles.state}>
          {loadingMsg}<LoadingDots />
        </div>
      )}

      {errorMsg && (
        <div className={styles.state}>
          <p>{errorMsg}</p>
          <p className={styles.stateSub}>Check your connection and try again.</p>
        </div>
      )}

      {renderData && (
        <>
          {/* Hero */}
          <div className={styles.panel}>
            <div className={styles.panelBar}>
              <span className={styles.panelTag}>// CURRENT_CONDITIONS</span>
              <span className={styles.panelTag} style={{ color: 'var(--cyan)' }}>● LIVE</span>
            </div>
            <div className={styles.hero}>
              <div className={styles.heroTop}>
                <div>
                  <div className={styles.locationLine}>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="8" cy="7" r="2.5" />
                      <path d="M8 2C5.24 2 3 4.24 3 7c0 3.75 5 9 5 9s5-5.25 5-9c0-2.76-2.24-5-5-5z" />
                    </svg>
                    {countryName}
                  </div>
                  <div className={styles.cityName}>{cityName}</div>
                  <div className={styles.conditionText}>{desc(renderData.c.weather_code)}</div>
                </div>

                <div className={styles.tempBlock}>
                  <div className={styles.wxIcon}>{ic(renderData.c.weather_code)}</div>
                  <div className={styles.bigTemp}>
                    {fmt(renderData.c.temperature_2m)}<sup>{u()}</sup>
                  </div>
                  <div className={styles.hiLo}>
                    H {fmt(renderData.d.temperature_2m_max[0])}{u()} &nbsp;·&nbsp; L {fmt(renderData.d.temperature_2m_min[0])}{u()}
                  </div>
                  <div className={styles.unitToggle}>
                    <button
                      className={`${styles.unitBtn} ${cel ? styles.unitBtnOn : ''}`}
                      onClick={() => setCel(true)}
                    >°C</button>
                    <button
                      className={`${styles.unitBtn} ${!cel ? styles.unitBtnOn : ''}`}
                      onClick={() => setCel(false)}
                    >°F</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className={styles.metricsWrap}>
            <div className={styles.sectionLabel}>// METRICS</div>
            <div className={styles.metricsGrid}>
              <div className={styles.metric}>
                <div className={styles.metricLabel}>Feels like</div>
                <div className={styles.metricVal}>{fmt(renderData.c.apparent_temperature)}{u()}</div>
              </div>
              <div className={styles.metric}>
                <div className={styles.metricLabel}>Humidity</div>
                <div className={styles.metricVal}>{Math.round(renderData.c.relative_humidity_2m)}%</div>
              </div>
              <div className={styles.metric}>
                <div className={styles.metricLabel}>Wind</div>
                <div className={styles.metricVal}>{Math.round(renderData.c.wind_speed_10m)}</div>
                <div className={styles.metricSub}>km/h · {windDir(renderData.c.wind_direction_10m)}</div>
              </div>
              <div className={styles.metric}>
                <div className={styles.metricLabel}>UV index</div>
                <div className={styles.metricVal}>{renderData.uvVal != null ? Math.round(renderData.uvVal) : '–'}</div>
                <div className={styles.metricSub}>{uvLabel(renderData.uvVal)}</div>
              </div>
              <div className={styles.metric}>
                <div className={styles.metricLabel}>Rain chance</div>
                <div className={styles.metricVal}>{Math.round(renderData.rainChance)}%</div>
              </div>
              <div className={styles.metric}>
                <div className={styles.metricLabel}>Precipitation</div>
                <div className={styles.metricVal}>{renderData.c.precipitation != null ? renderData.c.precipitation.toFixed(1) : '0'}</div>
                <div className={styles.metricSub}>mm now</div>
              </div>
              <div className={styles.metric}>
                <div className={styles.metricLabel}>Visibility</div>
                <div className={styles.metricVal}>{renderData.vis}</div>
              </div>
              <div className={styles.metric}>
                <div className={styles.metricLabel}>Pressure</div>
                <div className={styles.metricVal}>{renderData.c.pressure_msl != null ? Math.round(renderData.c.pressure_msl) : '–'}</div>
                <div className={styles.metricSub}>hPa</div>
              </div>
            </div>
          </div>

          {/* Hourly */}
          <div className={styles.hourlyWrap}>
            <div className={styles.sectionLabel}>// NEXT_12_HOURS</div>
            <div className={styles.hourlyRow}>
              {renderData.hSlice.map((hr, i) => (
                <div key={i} className={`${styles.hcard} ${hr.isNow ? styles.hcardNow : ''}`}>
                  <div className={styles.htime}>{hr.label}</div>
                  <div className={styles.hicon}>{ic(hr.code)}</div>
                  <div className={styles.htemp}>{fmt(hr.temp)}{u()}</div>
                  {hr.rain > 20 && <div className={styles.hrain}>{hr.rain}%</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Forecast */}
          <div className={styles.forecastWrap}>
            <div className={styles.sectionLabel}>// 7_DAY_FORECAST</div>
            <div className={styles.forecastGrid}>
              {renderData.forecast.map((f) => {
                const cls = [
                  styles.fday,
                  f.i === 0 ? styles.fdayToday : '',
                  selectedDay === f.i ? styles.fdaySelected : '',
                ].filter(Boolean).join(' ');
                return (
                  <div key={f.i} className={cls} onClick={() => toggleDay(f.i)}>
                    <div className={styles.fdayName}>{f.name}</div>
                    <div className={styles.fdayIcon}>{ic(f.code)}</div>
                    <div className={styles.fdayHi}>{fmt(f.hi)}{u()}</div>
                    <div className={styles.fdayLo}>{fmt(f.lo)}{u()}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Day detail */}
          {dayDetail && (
            <div className={styles.dayDetail}>
              <div className={styles.dayDetailHeader}>
                <div>
                  <div className={styles.dayDetailTitle}>{dayDetail.name}</div>
                  <div className={styles.dayDetailSub}>{ic(dayDetail.code)} {desc(dayDetail.code)}</div>
                </div>
                <div className={styles.dayDetailTemps}>
                  <strong>H {fmt(dayDetail.hi)}{u()}</strong><br />
                  L {fmt(dayDetail.lo)}{u()}
                  {dayDetail.uv != null && (
                    <>
                      <br />
                      <span className={styles.dayDetailUv}>UV {Math.round(dayDetail.uv)} · {uvLabel(dayDetail.uv)}</span>
                    </>
                  )}
                </div>
              </div>
              <div className={styles.dayDetailHourly}>
                {dayDetail.hours.map((hr, j) => (
                  <div key={j} className={styles.hcard}>
                    <div className={styles.htime}>{hr.hour}</div>
                    <div className={styles.hicon}>{ic(hr.code)}</div>
                    <div className={styles.htemp}>{fmt(hr.temp)}{u()}</div>
                    {hr.rain > 20 && <div className={styles.hrain}>{hr.rain}%</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
