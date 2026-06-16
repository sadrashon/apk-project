import React, { useState, useEffect } from 'react';
import './App.css';

const API_KEY = "f1346d1c9dbb6ca7a4ac96e168e4829c"; 

const CITIES_DATABASE = [
  { fa: "تهران", en: "Tehran" }, { fa: "زنجان", en: "Zanjan" }, { fa: "مشهد", en: "Mashhad" },
  { fa: "اصفهان", en: "Isfahan" }, { fa: "شیراز", en: "Shiraz" }, { fa: "تبریز", en: "Tabriz" },
  { fa: "کرج", en: "Karaj" }, { fa: "قم", en: "Qom" }, { fa: "اهواز", en: "Ahvaz" },
  { fa: "رشت", en: "Rasht" }, { fa: "کرمان", en: "Kerman" }, { fa: "یزد", en: "Yazd" },
  { fa: "همدان", en: "Hamadan" }, { fa: "اراک", en: "Arak" }, { fa: "اردبیل", en: "Ardabil" },
  { fa: "گرگان", en: "Gorgan" }, { fa: "ساری", en: "Sari" }, { fa: "بندرعباس", en: "Bandar Abbas" },
  { fa: "قزوین", en: "Qazvin" }, { fa: "سنندج", en: "Sanandaj" }, { fa: "خرم‌آباد", en: "Khorramabad" },
  { fa: "کرمانشاه", en: "Kermanshah" }, { fa: "ارومیه", en: "Urmia" }, { fa: "زاهدان", en: "Zahedan" },
  { fa: "بوشهر", en: "Bushehr" }, { fa: "ایلام", en: "Ilam" }, { fa: "شهرکرد", en: "Shahrekord" },
  { fa: "یاسوج", en: "Yasuj" }, { fa: "سمنان", en: "Semnan" }, { fa: "کیش", en: "Kish" },
  { fa: "قشم", en: "Qeshm" }, { fa: "کاشان", en: "Kashan" }, { fa: "بابل", en: "Babol" }, { fa: "آمل", en: "Amol" }
];

function App() {
  const [searchCity, setSearchCity] = useState('');
  const [suggestions, setSuggestions] = useState([]); 
  const [cityName, setCityName] = useState('');
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // 🔐 ایمن‌سازی لود اولیه از لوکال استوریج برای جلوگیری از خطای مقدار undefined
  const [defaultCity, setDefaultCity] = useState(() => {
    const saved = localStorage.getItem('defaultCity');
    return (saved && saved !== 'undefined' && saved.trim() !== '') ? saved : 'Tehran';
  });

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [startY, setStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const linkTag = document.createElement('link');
    linkTag.rel = 'stylesheet';
    linkTag.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=search';
    document.head.appendChild(linkTag);

    const styleTag = document.createElement('style');
    styleTag.innerHTML = `
      @keyframes neuSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      .neu-pull-spinner { display: inline-block; animation: neuSpin 1s linear infinite; font-size: 16px; }
      html, body, #root, .mobile-wrapper { overflow-x: hidden !important; width: 100%; max-width: 100vw; box-sizing: border-box; }
    `;
    document.head.appendChild(styleTag);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.head.removeChild(linkTag);
      document.head.removeChild(styleTag);
    };
  }, []);

  const getWeatherIcon = () => {
    if (!currentWeather || !currentWeather.weather) return "";
    const mainCondition = currentWeather.weather[0].main.toLowerCase();
    const iconCode = currentWeather.weather[0].icon;
    const isDay = iconCode ? iconCode.includes('d') : true;
    const windSpeed = currentWeather.wind ? currentWeather.wind.speed : 0;

    if (windSpeed > 7 || mainCondition === 'squall' || mainCondition === 'tornado') return "https://img.icons8.com/?size=160&id=Z7sWzX7N4Z7o&format=png";
    if (mainCondition === 'snow') return "https://img.icons8.com/?size=160&id=7qPHClH8Pwyw&format=png";
    if (mainCondition === 'rain' || mainCondition === 'drizzle' || mainCondition === 'thunderstorm') {
      if (isDay && currentWeather.weather[0].id === 500) return "https://img.icons8.com/?size=160&id=tZgL6r296N4o&format=png";
      return "https://img.icons8.com/?size=160&id=8cDNraQqdlD2&format=png";
    }
    if (mainCondition === 'clouds' || mainCondition === 'fog' || mainCondition === 'mist' || mainCondition === 'haze') {
      return isDay ? "https://img.icons8.com/?size=160&id=1MUqfGWx3fZS&format=png" : "https://img.icons8.com/?size=160&id=k3sZ8aIRgX4C&format=png";
    }
    return isDay ? "https://img.icons8.com/?size=160&id=XvgCaf8GDrCT&format=png" : "https://img.icons8.com/?size=160&id=RcOKEIh3aJYb&format=png";
  };

  const getUVIndex = (weather) => {
    if (!weather || !weather.sys) return "0";
    const now = Math.floor(Date.now() / 1000);
    if (!(now > weather.sys.sunrise && now < weather.sys.sunset)) return "0 (ناچیز)";
    const clouds = weather.clouds ? weather.clouds.all : 0;
    const roundedUV = Math.round(Math.max(1, Math.min(10, 10 - (clouds / 10))));
    if (roundedUV <= 2) return `${roundedUV} (کم)`;
    if (roundedUV <= 5) return `${roundedUV} (متوسط)`;
    if (roundedUV <= 7) return `${roundedUV} (زیاد)`;
    return `${roundedUV} (خیلی زیاد)`;
  };

  const fetchWeather = async (city, isSilent = false) => {
    if (!navigator.onLine) {
      setIsOnline(false);
      return;
    }
    if (!city || city === 'undefined') city = 'Tehran';
    if (!isSilent) setLoading(true);
    setError('');
    setSuggestions([]); 
    try {
      const cleanCity = city.trim();
      const currentRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cleanCity)}&units=metric&appid=${API_KEY}&lang=fa`);
      if (!currentRes.ok) throw new Error(`شهر "${cleanCity}" پیدا نشد!`);
      const currentData = await currentRes.json();
      
      const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(cleanCity)}&units=metric&appid=${API_KEY}&lang=fa`);
      const forecastData = await forecastRes.json();

      setCurrentWeather(currentData);
      setForecast(forecastData.list || []);
      setCityName(currentData.name); 
      setSearchCity(''); 
    } catch (err) {
      setError(err.message || "خطا در ارتباط با سرور");
    } finally {  // <--- اینجا را اصلاح کنید (اضافه کردن یک l دیگر)
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOnline) {
      fetchWeather(defaultCity);
    }
  }, [isOnline]);

  const handleStart = (clientY, scrollTop) => {
    if (scrollTop === 0 && !loading && isOnline) {
      setStartY(clientY);
      setIsPulling(true);
    }
  };

  const handleMove = (clientY) => {
    if (!isPulling || loading) return;
    const diff = clientY - startY;
    if (diff > 0) setPullDistance(Math.min(diff * 0.4, 65));
  };

  const handleEnd = async () => {
    if (!isPulling) return;
    setIsPulling(false);
    if (pullDistance > 45) {
      setPullDistance(35);
      await fetchWeather(cityName || defaultCity, true);
    }
    setPullDistance(0);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchCity(value);
    if (value.trim().length > 0) {
      setSuggestions(CITIES_DATABASE.filter(city => city.fa.includes(value) || city.en.toLowerCase().includes(value.toLowerCase())));
    } else {
      setSuggestions([]);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchCity.trim() !== '') {
      fetchWeather(searchCity);
    }
  };

  const handleUpdateDefaultCity = (cityEn) => {
    if (!cityEn || cityEn === 'undefined') return;
    localStorage.setItem('defaultCity', cityEn);
    setDefaultCity(cityEn);
    fetchWeather(cityEn); 
    setIsMenuOpen(false); 
  };

  // لودینگ اولیه ایمن
  if (loading && !currentWeather) {
    return (
      <div className="mobile-wrapper" style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#e0e0e0' }}>
        <p style={{ color: '#777', fontWeight: '500' }}>در حال دریافت اطلاعات...</p>
      </div>
    );
  }

  return (
    <div className="mobile-wrapper" style={{ overflowX: 'hidden', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      {/* 🛠️ تزریق و اجبار ارتفاع حداقلی به کانتینر نیومورفیک برای جلوگیری از صفر شدن ارتفاع */}
      <div className="neumorphic-container" style={{ position: 'relative', overflowX: 'hidden', display: 'flex', flexDirection: 'column', width: '100%', minHeight: '620px', height: '100%' }}>
        
        {/* منوی کشویی تنظیمات شهر پیش‌فرض */}
        <div style={{
          position: 'absolute', top: 0, right: isMenuOpen ? 0 : '-100%', width: '80%', height: '100%',
          backgroundColor: '#e0e0e0', zIndex: 100, transition: 'right 0.3s ease-in-out',
          boxShadow: '-5px 0 25px rgba(0,0,0,0.15)', padding: '25px 20px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' }}>
            <span style={{ fontWeight: '700', color: '#2b2d42', fontSize: '15px' }}>تنظیمات اپلیکیشن</span>
            <button onClick={() => setIsMenuOpen(false)} className="neu-btn-sm" style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>✕</button>
          </div>
          <div style={{ background: '#e0e0e0', borderRadius: '16px', padding: '20px 15px', boxShadow: 'inset 2px 2px 5px #babecc, inset -3px -3px 6px #ffffff' }}>
            <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px', fontSize: '13px', color: '#4a4a4a', textAlign: 'right' }}>⚙️ شهر پیش‌فرض شما:</label>
            <p style={{ fontSize: '11px', color: '#666', lineHeight: '1.6', marginBottom: '15px', textAlign: 'right', direction: 'rtl' }}>شهری که در زیر انتخاب می‌کنید، به عنوان لوکیشن اصلی ذخیره شده و با هر بار باز کردن برنامه به طور خودکار لود می‌شود.</p>
            <select 
              value={defaultCity} onChange={(e) => handleUpdateDefaultCity(e.target.value)}
              style={{ width: '100%', padding: '12px', border: 'none', borderRadius: '12px', backgroundColor: '#e0e0e0', color: '#2b2d42', fontWeight: '600', boxShadow: '3px 3px 6px #babecc, -3px -3px 6px #ffffff', outline: 'none', cursor: 'pointer', fontSize: '13px', direction: 'rtl' }}
            >
              {CITIES_DATABASE.map((city, index) => (<option key={index} value={city.en}>{city.fa} ({city.en})</option>))}
            </select>
          </div>
          <button onClick={() => handleUpdateDefaultCity(cityName || defaultCity)} style={{ marginTop: '15px', width: '100%', padding: '12px', border: 'none', borderRadius: '12px', backgroundColor: '#e0e0e0', color: '#4f5d75', fontWeight: '700', fontSize: '11px', boxShadow: '3px 3px 6px #babecc, -3px -3px 6px #ffffff', cursor: 'pointer' }}>تنظیم به عنوان پیش‌فرض</button>
        </div>

        {/* هدر بالای صفحه و باکس سرچ */}
        <div className="top-bar" style={{ flexShrink: 0 }}>
          <button className="neu-btn-sm">☰</button>
          <form onSubmit={handleSearchSubmit} className="search-inset-box" style={{ position: 'relative' }}>
            <input type="text" placeholder={cityName || "جستجوی شهر..."} value={searchCity} onChange={handleInputChange} className="neu-search-input" />
            <button type="submit" style={{background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center'}} className="search-icon">
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#5f6368' }}>search</span>
            </button>
            {suggestions.length > 0 && (
              <ul style={{ position: 'absolute', top: '105%', left: 0, right: 0, backgroundColor: '#e0e0e0', borderRadius: '14px', boxShadow: 'inset 2px 2px 5px #babecc, inset -5px -5px 10px #ffffff', listStyle: 'none', padding: '5px', margin: 0, maxHeight: '160px', overflowY: 'auto', zIndex: 99, textAlign: 'right' }}>
                {suggestions.map((city, index) => (
                  <li key={index} onClick={() => { fetchWeather(city.en); }} style={{ padding: '10px 15px', cursor: 'pointer', fontSize: '13px', color: '#4a4a4a', borderRadius: '8px', display: 'flex', justifyContext: 'space-between' }}>
                    <span style={{ fontWeight: '600' }}>{city.fa}</span><span style={{ color: '#888', fontSize: '11px' }}>{city.en}</span>
                  </li>
                ))}
              </ul>
            )}
          </form>
          <button className="neu-btn-sm" onClick={() => setIsMenuOpen(true)}>⋮</button>
        </div>

        {/* لودر متحرک کشویی فوقانی */}
        {isOnline && (
          <div style={{ height: `${pullDistance}px`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: isPulling ? 'none' : 'height 0.2s ease', fontSize: '11px', color: '#5f6368', fontWeight: '700', flexShrink: 0 }}>
            {pullDistance > 45 ? <span><span className="neu-pull-spinner">⏳</span> رها کنید برای بروزرسانی</span> : <span>👇 بکشید برای بروزرسانی</span>}
          </div>
        )}

        {/* محتوای اصلی نرم‌افزار */}
        <div 
          className="main-scrollable-content"
          style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0 20px 25px 20px', boxSizing: 'border-box' }}
          onTouchStart={(e) => handleStart(e.touches[0].clientY, e.currentTarget.scrollTop)}
          onTouchMove={(e) => handleMove(e.touches[0].clientY)}
          onTouchEnd={handleEnd}
          onMouseDown={(e) => handleStart(e.clientY, e.currentTarget.scrollTop)}
          onMouseMove={(e) => handleMove(e.clientY)}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
        >
          {/* کارت خطای قطع اتصال اینترنت */}
          {!isOnline && (
            <div style={{
              margin: '30px 0', padding: '25px 15px', borderRadius: '20px', backgroundColor: '#e0e0e0',
              boxShadow: 'inset 4px 4px 8px #babecc, inset -4px -4px 8px #ffffff', textAlign: 'center', direction: 'rtl'
            }}>
              <span style={{ fontSize: '40px', display: 'block', marginBottom: '10px' }}>⚠️</span>
              <h3 style={{ margin: '0 0 10px 0', color: '#d32f2f', fontWeight: '700', fontSize: '15px' }}>اتصال اینترنت برقرار نیست!</h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#666', lineHeight: '1.7' }}>لطفاً وضعیت وای‌فای یا داده تلفن همراه خود را بررسی کرده و مجدداً صفحه را به پایین بکشید.</p>
            </div>
          )}

          {error && isOnline && (
            <div style={{ background: '#fbe9e7', color: '#d32f2f', padding: '10px', borderRadius: '12px', fontSize: '12px', textAlign: 'center', margin: '10px 0' }}>{error}</div>
          )}

          {/* اگر کامپوننت لود شده بود ولی هنوز دیتای اولیه نرسیده بود، یک فالبک متنی به جای صفحه سفید نشان داده می‌شود */}
          {!currentWeather && isOnline && !error && (
            <p style={{textAlign:'center', color:'#888', marginTop:'40px', fontSize:'13px'}}>در حال واکشی اطلاعات آب و هوا...</p>
          )}

          {currentWeather && isOnline && (
            <>
              <div className="hero-weather-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '15px 0' }}>
                <div className="weather-text" style={{ textAlign: 'left' }}>
                  <h1 className="main-degree" style={{ margin: 0, lineHeight: '1' }}>{Math.round(currentWeather.main ? currentWeather.main.temp : 0)}°</h1>
                  <p className="weather-condition" style={{ textTransform: 'capitalize', margin: '5px 0 0 0' }}>{currentWeather.weather ? currentWeather.weather[0].description : ''}</p>
                </div>
                {getWeatherIcon() && <img src={getWeatherIcon()} alt="Condition" style={{ width: '85px', height: '85px', objectFit: 'contain' }} />}
              </div>

              <div className="forecast-row" style={{ margin: '10px 0' }}>
                <div className="neu-card-horizontal active" style={{ width: '100%', boxSizing: 'border-box' }}>
                  <span className="day-name">موقعیت انتخابی</span>
                  <span className="day-temp">{cityName}</span>
                </div>
              </div>

              <div className="chart-inset-panel" style={{ margin: '15px 0' }}>
                <div className="chart-header-info"><span>پیش‌بینی ساعتی (امروز)</span></div>
                <div className="svg-chart-wrapper">
                  <svg viewBox="0 0 320 60" className="smooth-line-svg">
                    {[20, 74, 128, 182, 236, 290].map((x, i) => <line key={i} x1={x} y1="10" x2={x} y2="50" stroke="#d1d9e6" strokeDasharray="3" />)}
                    <path 
                      d={`M 20 ${50 - (forecast[0]?.main?.temp || 10) * 1.5} L 74 ${50 - (forecast[1]?.main?.temp || 10) * 1.5} L 128 ${50 - (forecast[2]?.main?.temp || 10) * 1.5} L 182 ${50 - (forecast[3]?.main?.temp || 10) * 1.5} L 236 ${50 - (forecast[4]?.main?.temp || 10) * 1.5} L 290 ${50 - (forecast[5]?.main?.temp || 10) * 1.5}`} 
                      fill="none" stroke="#9aa0a6" strokeWidth="2"
                    />
                  </svg>
                </div>
                <div className="chart-timeline-labels">
                  {forecast && forecast.slice(0, 6).map((item, index) => (
                    <div className="time-col" key={index}><span>{Math.round(item.main ? item.main.temp : 0)}°</span><span>{item.dt_txt ? item.dt_txt.substring(11, 16) : ''}</span></div>
                  ))}
                </div>
              </div>

              <div className="details-section" style={{ marginTop: '15px' }}>
                <p className="details-title" style={{ marginBottom: '10px' }}>Details</p>
                <div className="details-grid">
                  <div className="neu-grid-card"><span className="card-label">WIND (باد)</span><span className="card-value">{currentWeather.wind ? currentWeather.wind.speed : 0} m/s</span></div>
                  <div className="neu-grid-card"><span className="card-label">UV INDEX</span><span className="card-value" style={{ fontSize: '13px' }}>{getUVIndex(currentWeather)}</span></div>
                  <div className="neu-grid-card"><span className="card-label">HUMIDITY (رطوبت)</span><span className="card-value">{currentWeather.main ? currentWeather.main.humidity : 0}%</span></div>
                  <div className="neu-grid-card"><span className="card-label">PRESSURE (فشار)</span><span className="card-value">{currentWeather.main ? currentWeather.main.pressure : 0} hPa</span></div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;