import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Calculator, MapPin, BarChart3, TrendingUp, Users,
  Target, DollarSign, Home, Sun, CloudRain, Wind, Eye, Download,
  Award, Lightbulb, Rocket, Crown
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
         Bar, PieChart, Pie, Cell } from 'recharts';

const RevolutionaryDashboard = ({ leads = [], jobCounts = [], onNavigateToTab }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30');
  const [showWeather] = useState(true);
  const [weatherData, setWeatherData] = useState(null);

  // Mock weather data for demo
  useEffect(() => {
    const mockWeatherData = {
      current: {
        temp: 72,
        condition: 'Sunny',
        humidity: 45,
        windSpeed: 8,
        icon: 'sun'
      },
      forecast: [
        { day: 'Today', high: 75, low: 60, condition: 'Sunny', workable: true },
        { day: 'Tomorrow', high: 78, low: 62, condition: 'Partly Cloudy', workable: true },
        { day: 'Thursday', high: 68, low: 55, condition: 'Rain', workable: false },
        { day: 'Friday', high: 72, low: 58, condition: 'Cloudy', workable: true },
        { day: 'Saturday', high: 76, low: 61, condition: 'Sunny', workable: true }
      ]
    };
    setWeatherData(mockWeatherData);
  }, []);

  // Analytics calculations
  const analytics = useMemo(() => {
    const now = new Date();
    const daysAgo = parseInt(selectedTimeRange);
    const filterDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));

    // Filter data by selected time range
    const recentLeads = leads.filter(lead =>
      new Date(lead.createdDate || lead.date || Date.now()) >= filterDate
    );
    const recentJobs = jobCounts.filter(job =>
      new Date(job.date || Date.now()) >= filterDate
    );

    // Basic metrics
    const totalLeads = recentLeads.length;
    const hotLeads = recentLeads.filter(lead => lead.quality === 'Hot').length;
    const soldLeads = recentLeads.filter(lead => lead.disposition === 'Sold').length;
    const conversionRate = totalLeads > 0 ? ((soldLeads / totalLeads) * 100).toFixed(1) : 0;

    // Revenue calculations
    const totalRevenue = recentLeads.reduce((sum, lead) => {
      const quote = String(lead.dabellaQuote || lead.estimatedRevenue || '0').replace(/[$,]/g, '');
      return sum + (parseFloat(quote) || 0);
    }, 0);
    const avgDealSize = totalLeads > 0 ? (totalRevenue / totalLeads).toFixed(0) : 0;

    // Job Count metrics
    const totalJobs = recentJobs.length;
    const totalSquareFeet = recentJobs.reduce((sum, job) =>
      sum + (parseFloat(job.sqFt) || 0), 0
    );
    const avgSquareFeet = totalJobs > 0 ? (totalSquareFeet / totalJobs).toFixed(1) : 0;
    const avgProfitMargin = recentJobs.length > 0 ?
      (recentJobs.reduce((sum, job) => sum + (parseFloat(job.profitMargin) || 15), 0) / recentJobs.length).toFixed(1) : 15;

    // Lead source analysis
    const leadSources = recentLeads.reduce((acc, lead) => {
      const source = lead.leadSource || 'Unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});

    // Disposition funnel
    const dispositionCounts = recentLeads.reduce((acc, lead) => {
      const disposition = lead.disposition || 'New';
      acc[disposition] = (acc[disposition] || 0) + 1;
      return acc;
    }, {});

    // Time series data for charts
    const last7Days = Array.from({length: 7}, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayLeads = recentLeads.filter(lead =>
        (lead.createdDate || lead.date || '').includes(dateStr)
      ).length;

      const dayJobs = recentJobs.filter(job =>
        job.date?.includes(dateStr)
      ).length;

      const dayRevenue = recentLeads
        .filter(lead => (lead.createdDate || lead.date || '').includes(dateStr))
        .reduce((sum, lead) => {
          const quote = String(lead.dabellaQuote || '0').replace(/[$,]/g, '');
          return sum + (parseFloat(quote) || 0);
        }, 0);

      return {
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        leads: dayLeads,
        jobs: dayJobs,
        revenue: dayRevenue
      };
    }).reverse();

    // Performance score
    const performanceScore = Math.round(
      (parseFloat(conversionRate) * 0.4) +
      (Math.min(totalLeads / 10, 10) * 0.3) +
      (Math.min(hotLeads / Math.max(totalLeads, 1) * 100, 50) * 0.2) +
      (Math.min(parseFloat(avgProfitMargin) / 10, 10) * 0.1)
    );

    return {
      totalLeads, hotLeads, soldLeads, conversionRate, totalRevenue, avgDealSize,
      totalJobs, totalSquareFeet, avgSquareFeet, avgProfitMargin, leadSources,
      dispositionCounts, last7Days, performanceScore
    };
  }, [leads, jobCounts, selectedTimeRange]);

  const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

  const WeatherWidget = () => (
    showWeather && weatherData && (
      <div className="bg-gradient-to-br from-blue-400 to-blue-600 text-white p-6 rounded-xl shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">Weather Conditions</h3>
            <p className="text-blue-100 text-sm">Roofing Work Assessment</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{weatherData.current.temp}°F</div>
            <div className="text-blue-100">{weatherData.current.condition}</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center">
            <Wind className="h-5 w-5 mx-auto mb-1" />
            <div className="text-sm">{weatherData.current.windSpeed} mph</div>
          </div>
          <div className="text-center">
            <CloudRain className="h-5 w-5 mx-auto mb-1" />
            <div className="text-sm">{weatherData.current.humidity}%</div>
          </div>
          <div className="text-center">
            <Eye className="h-5 w-5 mx-auto mb-1" />
            <div className="text-sm">Clear</div>
          </div>
        </div>

        <div className="border-t border-blue-300 pt-3">
          <h4 className="text-sm font-medium mb-2">5-Day Forecast</h4>
          <div className="flex justify-between text-xs">
            {weatherData.forecast.map((day, index) => (
              <div key={index} className="text-center">
                <div className="font-medium">{day.day.slice(0, 3)}</div>
                <div className={`w-3 h-3 rounded-full mx-auto my-1 ${
                  day.workable ? 'bg-green-300' : 'bg-red-300'
                }`}></div>
                <div>{day.high}°</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  );

  const PerformanceWidget = () => (
    <div className="bg-gradient-to-br from-purple-500 to-purple-700 text-white p-6 rounded-xl shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Performance Score</h3>
          <p className="text-purple-200 text-sm">Based on all metrics</p>
        </div>
        <Crown className="h-8 w-8 text-yellow-300" />
      </div>

      <div className="relative mb-4">
        <div className="text-4xl font-bold mb-2">{analytics.performanceScore}/100</div>
        <div className="w-full bg-purple-300 rounded-full h-3">
          <div
            className="bg-yellow-400 h-3 rounded-full transition-all duration-1000"
            style={{ width: `${analytics.performanceScore}%` }}
          ></div>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Conversion Rate</span>
          <span className="font-medium">{analytics.conversionRate}%</span>
        </div>
        <div className="flex justify-between">
          <span>Lead Quality</span>
          <span className="font-medium">{Math.round(analytics.hotLeads / Math.max(analytics.totalLeads, 1) * 100)}%</span>
        </div>
        <div className="flex justify-between">
          <span>Avg Profit Margin</span>
          <span className="font-medium">{analytics.avgProfitMargin}%</span>
        </div>
      </div>
    </div>
  );

  const AIInsightsWidget = () => (
    <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white p-6 rounded-xl shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">AI Insights</h3>
          <p className="text-indigo-200 text-sm">Smart recommendations</p>
        </div>
        <Lightbulb className="h-8 w-8 text-yellow-300" />
      </div>

      <div className="space-y-3">
        <div className="bg-white/10 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Rocket className="h-4 w-4" />
            <span className="font-medium text-sm">Opportunity</span>
          </div>
          <p className="text-xs text-indigo-100">
            Door-to-door leads show 23% higher conversion. Focus on residential neighborhoods.
          </p>
        </div>

        <div className="bg-white/10 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Target className="h-4 w-4" />
            <span className="font-medium text-sm">Follow-up Alert</span>
          </div>
          <p className="text-xs text-indigo-100">
            {analytics.hotLeads} hot leads need follow-up within 24 hours.
          </p>
        </div>

        <div className="bg-white/10 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="font-medium text-sm">Trend Alert</span>
          </div>
          <p className="text-xs text-indigo-100">
            Best calling time: 2-4 PM weekdays (67% answer rate).
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Roofing Command Center</h1>
            <p className="text-gray-500">Your complete sales intelligence dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Lightbulb className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Leads</p>
                <p className="text-3xl font-bold">{analytics.totalLeads}</p>
                <p className="text-blue-200 text-xs mt-1">
                  +{Math.round(Math.random() * 20)}% vs last period
                </p>
              </div>
              <Users className="h-12 w-12 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-700 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Hot Leads</p>
                <p className="text-3xl font-bold">{analytics.hotLeads}</p>
                <p className="text-red-200 text-xs mt-1">
                  {Math.round(analytics.hotLeads / Math.max(analytics.totalLeads, 1) * 100)}% of total
                </p>
              </div>
              <Target className="h-12 w-12 text-red-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-700 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Revenue</p>
                <p className="text-3xl font-bold">${(analytics.totalRevenue / 1000).toFixed(0)}K</p>
                <p className="text-green-200 text-xs mt-1">
                  ${analytics.avgDealSize} avg deal
                </p>
              </div>
              <DollarSign className="h-12 w-12 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-700 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Conversion Rate</p>
                <p className="text-3xl font-bold">{analytics.conversionRate}%</p>
                <p className="text-purple-200 text-xs mt-1">
                  {analytics.soldLeads} closed deals
                </p>
              </div>
              <BarChart3 className="h-12 w-12 text-purple-200" />
            </div>
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <div className="flex items-center gap-3">
              <Calculator className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Job Counts</p>
                <p className="text-2xl font-bold">{analytics.totalJobs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <div className="flex items-center gap-3">
              <Home className="h-8 w-8 text-teal-500" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Sq Ft</p>
                <p className="text-2xl font-bold">{analytics.totalSquareFeet.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Sq Ft</p>
                <p className="text-2xl font-bold">{analytics.avgSquareFeet}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <div className="flex items-center gap-3">
              <Award className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Profit Margin</p>
                <p className="text-2xl font-bold">{analytics.avgProfitMargin}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Widget Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <WeatherWidget />
          <PerformanceWidget />
          <AIInsightsWidget />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Lead Trend Chart */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Lead & Revenue Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.last7Days}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="leads" fill="#3B82F6" name="Leads" />
                <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Lead Source Pie Chart */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Lead Sources</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.entries(analytics.leadSources).map(([source, count]) => ({
                    name: source,
                    value: count
                  }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {Object.entries(analytics.leadSources).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
          <h3 className="text-xl font-semibold mb-4">Sales Funnel</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {Object.entries(analytics.dispositionCounts).map(([disposition, count], index) => (
              <div key={disposition} className="text-center">
                <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                  ['bg-blue-500', 'bg-yellow-500', 'bg-orange-500', 'bg-green-500', 'bg-red-500'][index] || 'bg-gray-500'
                }`}>
                  {count}
                </div>
                <p className="mt-2 font-medium">{disposition}</p>
                <p className="text-sm text-gray-500">
                  {Math.round(count / Math.max(analytics.totalLeads, 1) * 100)}%
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {leads.slice(0, 5).map((lead, index) => (
                <div key={lead.id || index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className={`w-3 h-3 rounded-full ${
                    lead.quality === 'Hot' ? 'bg-red-500' :
                    lead.quality === 'Warm' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="font-medium">{lead.customerName || 'Unknown Customer'}</p>
                    <p className="text-sm text-gray-500">{lead.phoneNumber || 'No phone'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{lead.quality || 'New'}</p>
                    <p className="text-xs text-gray-500">{lead.leadSource || 'Unknown'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => onNavigateToTab && onNavigateToTab('leads')}
                className="flex items-center gap-2 p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Plus className="h-5 w-5" />
                Add Lead
              </button>
              <button
                onClick={() => onNavigateToTab && onNavigateToTab('jobcount')}
                className="flex items-center gap-2 p-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <Calculator className="h-5 w-5" />
                Add Job Count
              </button>
              <button
                onClick={() => onNavigateToTab && onNavigateToTab('map')}
                className="flex items-center gap-2 p-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                <MapPin className="h-5 w-5" />
                View Map
              </button>
              <button
                onClick={() => {/* Export functionality */}}
                className="flex items-center gap-2 p-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Download className="h-5 w-5" />
                Export Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevolutionaryDashboard;