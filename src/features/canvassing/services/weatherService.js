/**
 * Weather Service
 * Integration with OpenWeather API for canvassing optimization
 * Note: Requires REACT_APP_OPENWEATHER_API_KEY environment variable
 */

const OPENWEATHER_API_KEY = process.env.REACT_APP_OPENWEATHER_API_KEY || 'demo';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

let weatherCache = {
  data: null,
  timestamp: null,
};

/**
 * Fetch current weather for a location
 */
export const getCurrentWeather = async (lat, lng) => {
  try {
    // Check cache
    if (weatherCache.data && weatherCache.timestamp && Date.now() - weatherCache.timestamp < CACHE_DURATION) {
      return { success: true, data: weatherCache.data };
    }

    if (OPENWEATHER_API_KEY === 'demo') {
      // Return mock data if no API key
      const mockWeather = {
        temp: 72,
        feelsLike: 70,
        condition: 'Sunny',
        description: 'Clear skies',
        humidity: 45,
        windSpeed: 5,
        visibility: 10,
        icon: '01d',
        canvassingScore: 95,
        recommendation: 'Excellent conditions for canvassing!',
      };

      weatherCache = {
        data: mockWeather,
        timestamp: Date.now(),
      };

      return { success: true, data: mockWeather };
    }

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${OPENWEATHER_API_KEY}&units=imperial`
    );

    if (!response.ok) {
      throw new Error('Weather API request failed');
    }

    const data = await response.json();

    const weatherData = {
      temp: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      condition: data.weather[0].main,
      description: data.weather[0].description,
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed),
      visibility: Math.round(data.visibility / 1609.34), // Convert to miles
      icon: data.weather[0].icon,
      canvassingScore: calculateCanvassingScore(data),
      recommendation: getCanvassingRecommendation(data),
    };

    weatherCache = {
      data: weatherData,
      timestamp: Date.now(),
    };

    return { success: true, data: weatherData };
  } catch (error) {
    console.error('Weather fetch error:', error);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
};

/**
 * Fetch weather forecast for next 5 days
 */
export const getWeatherForecast = async (lat, lng) => {
  try {
    if (OPENWEATHER_API_KEY === 'demo') {
      // Mock forecast data
      return {
        success: true,
        data: [
          { day: 'Today', temp: 72, condition: 'Sunny', score: 95 },
          { day: 'Tomorrow', temp: 68, condition: 'Partly Cloudy', score: 85 },
          { day: 'Sat', temp: 65, condition: 'Rainy', score: 40 },
          { day: 'Sun', temp: 70, condition: 'Sunny', score: 90 },
          { day: 'Mon', temp: 73, condition: 'Clear', score: 95 },
        ],
      };
    }

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${OPENWEATHER_API_KEY}&units=imperial`
    );

    if (!response.ok) {
      throw new Error('Forecast API request failed');
    }

    const data = await response.json();

    // Process forecast data (daily aggregates)
    const dailyForecasts = [];
    const days = {};

    data.list.forEach((item) => {
      const date = new Date(item.dt * 1000);
      const day = date.toLocaleDateString('en-US', { weekday: 'short' });

      if (!days[day]) {
        days[day] = {
          day,
          temp: Math.round(item.main.temp),
          condition: item.weather[0].main,
          score: calculateCanvassingScore(item),
        };
        dailyForecasts.push(days[day]);
      }
    });

    return {
      success: true,
      data: dailyForecasts.slice(0, 5),
    };
  } catch (error) {
    console.error('Forecast fetch error:', error);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
};

/**
 * Calculate canvassing suitability score (0-100)
 */
const calculateCanvassingScore = (weatherData) => {
  let score = 100;

  const temp = weatherData.main?.temp || weatherData.temp;
  const condition = weatherData.weather?.[0]?.main || weatherData.condition;
  const windSpeed = weatherData.wind?.speed || 0;

  // Temperature penalties
  if (temp < 40 || temp > 90) score -= 30;
  else if (temp < 50 || temp > 85) score -= 15;

  // Weather condition penalties
  if (condition === 'Rain' || condition === 'Thunderstorm') score -= 40;
  if (condition === 'Snow') score -= 50;
  if (condition === 'Drizzle') score -= 20;
  if (condition === 'Mist' || condition === 'Fog') score -= 10;

  // Wind penalties
  if (windSpeed > 20) score -= 20;
  else if (windSpeed > 15) score -= 10;

  return Math.max(0, Math.min(100, score));
};

/**
 * Get canvassing recommendation based on weather
 */
const getCanvassingRecommendation = (weatherData) => {
  const score = calculateCanvassingScore(weatherData);
  const condition = weatherData.weather[0].main;
  const temp = Math.round(weatherData.main.temp);

  if (score >= 80) {
    return `Perfect canvassing weather! ${temp}°F and ${condition.toLowerCase()}.`;
  } else if (score >= 60) {
    return `Good conditions for canvassing. ${temp}°F, ${condition.toLowerCase()}.`;
  } else if (score >= 40) {
    return `Fair conditions. ${condition} may reduce effectiveness.`;
  } else {
    return `Poor conditions for canvassing. Consider rescheduling.`;
  }
};

/**
 * Get best canvassing times for today
 */
export const getBestCanvassingTimes = () => {
  const now = new Date();
  const hour = now.getHours();

  const times = [
    { time: '10:00 AM - 12:00 PM', score: 70, label: 'Good' },
    { time: '2:00 PM - 4:00 PM', score: 75, label: 'Good' },
    { time: '5:00 PM - 8:00 PM', score: 95, label: 'Best' },
  ];

  // Highlight current best time
  if (hour >= 17 && hour < 20) {
    return { currentBest: times[2], allTimes: times };
  } else if (hour >= 14 && hour < 16) {
    return { currentBest: times[1], allTimes: times };
  } else if (hour >= 10 && hour < 12) {
    return { currentBest: times[0], allTimes: times };
  }

  return { currentBest: times[2], allTimes: times };
};
