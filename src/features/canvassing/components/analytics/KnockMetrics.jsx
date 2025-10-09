import React, { useMemo } from 'react';
import {
  TrendingUp,
  Target,
  Users,
  DollarSign,
  Clock,
  MapPin,
  Award,
  Activity,
} from 'lucide-react';

/**
 * KnockMetrics - Comprehensive analytics dashboard for canvassing performance
 * Inspired by SalesRabbit's analytics and leaderboards
 */
const KnockMetrics = ({ properties, visits = [], timeFrame = 'today' }) => {
  // Calculate all metrics
  const metrics = useMemo(() => {
    const now = new Date();
    let startDate;

    // Determine time frame
    switch (timeFrame) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(0); // All time
    }

    // Filter properties and visits by time frame
    const filteredVisits = visits.filter(
      (v) => new Date(v.visited_at) >= startDate
    );

    // Calculate metrics
    const totalKnocks = filteredVisits.length;
    const interested = properties.filter((p) => p.status === 'Interested').length;
    const appointments = properties.filter((p) => p.status === 'Appointment').length;
    const sold = properties.filter((p) => p.status === 'Sold').length;
    const notHome = properties.filter((p) => p.status === 'Not Home').length;
    const notInterested = properties.filter((p) => p.status === 'Not Interested').length;

    // Calculate conversion rates
    const interestedRate = totalKnocks > 0 ? ((interested / totalKnocks) * 100).toFixed(1) : 0;
    const appointmentRate = totalKnocks > 0 ? ((appointments / totalKnocks) * 100).toFixed(1) : 0;
    const closeRate = totalKnocks > 0 ? ((sold / totalKnocks) * 100).toFixed(1) : 0;

    // Calculate time-based metrics
    const hoursWorked = filteredVisits.length > 0
      ? (filteredVisits.length * 5) / 60 // Assume 5 min per knock
      : 0;
    const knocksPerHour = hoursWorked > 0 ? (totalKnocks / hoursWorked).toFixed(1) : 0;

    // Calculate doors per deal
    const doorsPerDeal = sold > 0 ? (totalKnocks / sold).toFixed(1) : 0;

    return {
      totalKnocks,
      interested,
      appointments,
      sold,
      notHome,
      notInterested,
      interestedRate,
      appointmentRate,
      closeRate,
      knocksPerHour,
      doorsPerDeal,
      hoursWorked: hoursWorked.toFixed(1),
    };
  }, [properties, visits, timeFrame]);

  // Stat card component
  const StatCard = ({ icon: Icon, label, value, subtext, color, bgColor }) => (
    <div className={`${bgColor} rounded-xl p-4 border-2 border-${color}-200`}>
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 bg-${color}-100 rounded-lg`}>
          <Icon className={`w-5 h-5 text-${color}-600`} />
        </div>
        <span className={`text-2xl font-bold text-${color}-700`}>{value}</span>
      </div>
      <p className="text-sm font-semibold text-gray-700">{label}</p>
      {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Activity className="w-8 h-8" />
          <h2 className="text-2xl font-bold">Performance Dashboard</h2>
        </div>
        <p className="text-blue-100 text-sm">
          Track your canvassing success and optimize your approach
        </p>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Target}
          label="Total Knocks"
          value={metrics.totalKnocks}
          subtext={`${metrics.knocksPerHour} per hour`}
          color="blue"
          bgColor="bg-blue-50"
        />
        <StatCard
          icon={TrendingUp}
          label="Interested"
          value={metrics.interested}
          subtext={`${metrics.interestedRate}% rate`}
          color="green"
          bgColor="bg-green-50"
        />
        <StatCard
          icon={Users}
          label="Appointments"
          value={metrics.appointments}
          subtext={`${metrics.appointmentRate}% rate`}
          color="purple"
          bgColor="bg-purple-50"
        />
        <StatCard
          icon={Award}
          label="Sold"
          value={metrics.sold}
          subtext={`${metrics.closeRate}% close rate`}
          color="yellow"
          bgColor="bg-yellow-50"
        />
      </div>

      {/* Conversion Funnel */}
      <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Conversion Funnel
        </h3>
        <div className="space-y-3">
          {/* Total Knocks */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Total Knocks</span>
              <span className="text-sm font-bold text-gray-900">{metrics.totalKnocks}</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>

          {/* Interested */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Interested</span>
              <span className="text-sm font-bold text-green-700">
                {metrics.interested} ({metrics.interestedRate}%)
              </span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full"
                style={{ width: `${metrics.interestedRate}%` }}
              ></div>
            </div>
          </div>

          {/* Appointments */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Appointments Set</span>
              <span className="text-sm font-bold text-purple-700">
                {metrics.appointments} ({metrics.appointmentRate}%)
              </span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full"
                style={{ width: `${metrics.appointmentRate}%` }}
              ></div>
            </div>
          </div>

          {/* Sold */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Deals Closed</span>
              <span className="text-sm font-bold text-yellow-700">
                {metrics.sold} ({metrics.closeRate}%)
              </span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-500 rounded-full"
                style={{ width: `${metrics.closeRate}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Efficiency Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-5 border-2 border-indigo-200">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-6 h-6 text-indigo-600" />
            <div>
              <p className="text-xs text-indigo-600 font-medium">Efficiency</p>
              <p className="text-2xl font-bold text-indigo-900">{metrics.knocksPerHour}</p>
            </div>
          </div>
          <p className="text-sm text-indigo-700">Knocks per hour</p>
          <p className="text-xs text-indigo-600 mt-1">{metrics.hoursWorked} hours worked</p>
        </div>

        <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-5 border-2 border-pink-200">
          <div className="flex items-center gap-3 mb-3">
            <MapPin className="w-6 h-6 text-pink-600" />
            <div>
              <p className="text-xs text-pink-600 font-medium">Hit Rate</p>
              <p className="text-2xl font-bold text-pink-900">
                {metrics.totalKnocks - metrics.notHome}
              </p>
            </div>
          </div>
          <p className="text-sm text-pink-700">Successful contacts</p>
          <p className="text-xs text-pink-600 mt-1">{metrics.notHome} not home</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5 border-2 border-orange-200">
          <div className="flex items-center gap-3 mb-3">
            <DollarSign className="w-6 h-6 text-orange-600" />
            <div>
              <p className="text-xs text-orange-600 font-medium">Doors per Deal</p>
              <p className="text-2xl font-bold text-orange-900">
                {metrics.doorsPerDeal || 'N/A'}
              </p>
            </div>
          </div>
          <p className="text-sm text-orange-700">Average knocks per sale</p>
          <p className="text-xs text-orange-600 mt-1">
            {metrics.sold} total deal{metrics.sold !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Status Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatusBadge label="Interested" count={metrics.interested} color="green" />
          <StatusBadge label="Not Interested" count={metrics.notInterested} color="red" />
          <StatusBadge label="Not Home" count={metrics.notHome} color="gray" />
          <StatusBadge label="Appointments" count={metrics.appointments} color="blue" />
        </div>
      </div>

      {/* Performance Tips */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
        <h3 className="text-lg font-bold text-purple-900 mb-3 flex items-center gap-2">
          <Award className="w-5 h-5" />
          Performance Insights
        </h3>
        <ul className="space-y-2 text-sm text-purple-800">
          {metrics.interestedRate > 15 && (
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Great job! Your interest rate is above average.</span>
            </li>
          )}
          {metrics.knocksPerHour < 8 && (
            <li className="flex items-start gap-2">
              <span className="text-yellow-600 font-bold">!</span>
              <span>Try to increase your knock rate to 10-12 per hour for better results.</span>
            </li>
          )}
          {metrics.notHome > metrics.totalKnocks * 0.4 && (
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">→</span>
              <span>
                High "not home" rate. Consider canvassing in the evening (5-8 PM) or weekends.
              </span>
            </li>
          )}
          {metrics.sold > 0 && (
            <li className="flex items-start gap-2">
              <span className="text-purple-600 font-bold">★</span>
              <span>Congratulations on {metrics.sold} sale{metrics.sold !== 1 ? 's' : ''}!</span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

// Status badge component
const StatusBadge = ({ label, count, color }) => {
  const colors = {
    green: 'bg-green-100 text-green-800 border-green-300',
    red: 'bg-red-100 text-red-800 border-red-300',
    blue: 'bg-blue-100 text-blue-800 border-blue-300',
    gray: 'bg-gray-100 text-gray-800 border-gray-300',
  };

  return (
    <div className={`${colors[color]} rounded-lg p-3 border-2 text-center`}>
      <p className="text-2xl font-bold">{count}</p>
      <p className="text-xs font-medium mt-1">{label}</p>
    </div>
  );
};

export default KnockMetrics;
