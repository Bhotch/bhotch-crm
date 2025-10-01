import React, { useMemo } from 'react';
import {
  TrendingUp,
  Users,
  MapPin,
  Target,
  Clock,
  DollarSign,
  Award,
  Zap,
  BarChart3,
  Activity,
} from 'lucide-react';
import { useCanvassingStore } from '../../store/canvassingStore';
import { PROPERTY_STATUS } from '../map/PropertyMarker';

/**
 * CanvassingDashboard Component
 * Displays KPIs and performance metrics for canvassing operations
 */
const CanvassingDashboard = () => {
  const { properties, analytics, territories } = useCanvassingStore();

  // Calculate comprehensive stats
  const stats = useMemo(() => {
    const total = properties.length;
    const contacted = properties.filter((p) => p.status !== PROPERTY_STATUS.NOT_CONTACTED).length;
    const interested = properties.filter((p) => p.status === PROPERTY_STATUS.INTERESTED).length;
    const appointments = properties.filter((p) => p.status === PROPERTY_STATUS.APPOINTMENT).length;
    const sold = properties.filter((p) => p.status === PROPERTY_STATUS.SOLD).length;
    const dnc = properties.filter((p) => p.status === PROPERTY_STATUS.DNC).length;
    const notHome = properties.filter((p) => p.status === PROPERTY_STATUS.NOT_HOME).length;

    const contactRate = total > 0 ? ((contacted / total) * 100).toFixed(1) : 0;
    const interestRate = contacted > 0 ? ((interested / contacted) * 100).toFixed(1) : 0;
    const appointmentRate = contacted > 0 ? ((appointments / contacted) * 100).toFixed(1) : 0;
    const conversionRate = contacted > 0 ? ((sold / contacted) * 100).toFixed(1) : 0;

    // Territory stats
    const territoriesCount = territories.length;

    return {
      total,
      contacted,
      interested,
      appointments,
      sold,
      dnc,
      notHome,
      notContacted: total - contacted,
      contactRate,
      interestRate,
      appointmentRate,
      conversionRate,
      territoriesCount,
    };
  }, [properties, territories]);

  const StatCard = ({ icon: Icon, label, value, subValue, trend, color }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <div className="flex items-center text-green-600 text-sm font-medium">
            <TrendingUp className="w-4 h-4 mr-1" />
            {trend}
          </div>
        )}
      </div>
      <div>
        <p className="text-gray-600 text-sm mb-1">{label}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {subValue && <p className="text-gray-500 text-sm mt-1">{subValue}</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Canvassing Performance Dashboard</h2>
            <p className="text-blue-100">Track your door-to-door sales metrics in real-time</p>
          </div>
          <BarChart3 className="w-16 h-16 opacity-50" />
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={MapPin}
          label="Total Properties"
          value={stats.total}
          subValue={`${stats.contacted} contacted`}
          color="bg-blue-600"
        />

        <StatCard
          icon={Target}
          label="Contact Rate"
          value={`${stats.contactRate}%`}
          subValue={`${stats.contacted} / ${stats.total} doors`}
          color="bg-green-600"
          trend="+12%"
        />

        <StatCard
          icon={Users}
          label="Interested Leads"
          value={stats.interested}
          subValue={`${stats.interestRate}% interest rate`}
          color="bg-purple-600"
        />

        <StatCard
          icon={DollarSign}
          label="Conversions"
          value={stats.sold}
          subValue={`${stats.conversionRate}% conversion rate`}
          color="bg-amber-600"
        />
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-blue-600" />
          Performance Breakdown
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{stats.appointments}</div>
            <div className="text-sm text-gray-600 mt-1">Appointments</div>
            <div className="text-xs text-blue-600 font-medium">{stats.appointmentRate}% rate</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{stats.notHome}</div>
            <div className="text-sm text-gray-600 mt-1">Not Home</div>
            <div className="text-xs text-gray-500">Follow-up needed</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{stats.dnc}</div>
            <div className="text-sm text-gray-600 mt-1">Do Not Contact</div>
            <div className="text-xs text-gray-500">Excluded</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{stats.notContacted}</div>
            <div className="text-sm text-gray-600 mt-1">Not Contacted</div>
            <div className="text-xs text-green-600 font-medium">Opportunities</div>
          </div>
        </div>
      </div>

      {/* Territories & Routes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Territory Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Zap className="w-5 h-5 mr-2 text-blue-600" />
            Territory Coverage
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Active Territories</span>
              <span className="text-2xl font-bold text-gray-900">{stats.territoriesCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Avg. Properties/Territory</span>
              <span className="text-2xl font-bold text-gray-900">
                {stats.territoriesCount > 0 ? Math.round(stats.total / stats.territoriesCount) : 0}
              </span>
            </div>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <Award className="w-4 h-4 inline mr-1" />
                You're covering <strong>{stats.territoriesCount}</strong> territories with a{' '}
                <strong>{stats.contactRate}%</strong> contact rate!
              </p>
            </div>
          </div>
        </div>

        {/* Daily Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-blue-600" />
            Today's Activity
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Doors Knocked</span>
              <span className="text-2xl font-bold text-gray-900">{analytics.totalDoorsKnocked || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Contacts Made</span>
              <span className="text-2xl font-bold text-gray-900">{analytics.contactsMade || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Appointments Set</span>
              <span className="text-2xl font-bold text-gray-900">{analytics.appointmentsSet || 0}</span>
            </div>
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                <TrendingUp className="w-4 h-4 inline mr-1" />
                Great work! You're on track to exceed your daily goals.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Conversion Funnel</h3>
        <div className="space-y-3">
          {[
            { label: 'Total Properties', count: stats.total, percent: 100, color: 'bg-gray-400' },
            {
              label: 'Contacted',
              count: stats.contacted,
              percent: (stats.contacted / stats.total) * 100 || 0,
              color: 'bg-blue-500',
            },
            {
              label: 'Interested',
              count: stats.interested,
              percent: (stats.interested / stats.total) * 100 || 0,
              color: 'bg-green-500',
            },
            {
              label: 'Appointments',
              count: stats.appointments,
              percent: (stats.appointments / stats.total) * 100 || 0,
              color: 'bg-purple-500',
            },
            {
              label: 'Sold',
              count: stats.sold,
              percent: (stats.sold / stats.total) * 100 || 0,
              color: 'bg-amber-500',
            },
          ].map((stage, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">{stage.label}</span>
                <span className="text-sm text-gray-600">
                  {stage.count} ({stage.percent.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`${stage.color} h-3 rounded-full transition-all duration-500`}
                  style={{ width: `${stage.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tips & Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
          <Zap className="w-5 h-5 mr-2" />
          Performance Insights
        </h3>
        <div className="space-y-2 text-sm text-blue-800">
          {stats.contactRate < 30 && (
            <p>• Your contact rate is low. Try canvassing during evening hours (5-8 PM) for better results.</p>
          )}
          {stats.interestRate > 50 && (
            <p>• Excellent interest rate! Your pitch is resonating well with homeowners.</p>
          )}
          {stats.notHome > stats.contacted * 0.3 && (
            <p>• High "Not Home" rate. Consider re-visiting these properties at different times.</p>
          )}
          {stats.sold > 0 && (
            <p>
              • Congratulations on your sales! You've achieved a {stats.conversionRate}% conversion rate.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CanvassingDashboard;
