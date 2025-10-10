import React, { useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { StatCard } from '../../components/StatCard';
import {
  DollarSign, Users, Target, TrendingUp, Calendar,
  ClipboardList, Calculator, Map,
  ArrowUpRight, Percent, Clock, CheckCircle, RefreshCw
} from 'lucide-react';

function DashboardView({ stats, leads, jobCounts = [], onNavigateToTab, onRefresh }) {
  const recentLeads = useMemo(() => leads.slice(0, 5), [leads]);
  const recentJobCounts = useMemo(() => jobCounts.slice(0, 3), [jobCounts]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  // Calculate additional statistics with useMemo for performance
  const dispositionStats = useMemo(() => {
    const scheduledLeads = leads.filter(l => l.disposition === 'Scheduled').length;
    const followUpLeads = leads.filter(l => l.disposition === 'Follow Up').length;
    const insuranceLeads = leads.filter(l => l.disposition === 'Insurance').length;
    const closedSold = leads.filter(l => l.disposition === 'Closed Sold').length;
    const newLeads = leads.filter(l => l.disposition === 'New').length;
    const conversionRate = stats.totalLeads > 0 ? ((closedSold / stats.totalLeads) * 100).toFixed(1) : '0.0';

    return { scheduledLeads, followUpLeads, insuranceLeads, closedSold, newLeads, conversionRate };
  }, [leads, stats.totalLeads]);

  const handleRefresh = useCallback(() => {
    if (onRefresh) {
      onRefresh();
    }
  }, [onRefresh]);

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-base text-gray-600 mt-1">Comprehensive overview of your roofing business</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleString()}
          </div>
          {onRefresh && (
            <button
              onClick={handleRefresh}
              className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              title="Refresh dashboard data"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          )}
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Leads"
          value={stats.totalLeads}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Hot Leads"
          value={stats.hotLeads}
          icon={TrendingUp}
          color="red"
        />
        <StatCard
          title="Quoted Leads"
          value={stats.quotedLeads}
          icon={Target}
          color="green"
        />
        <StatCard
          title="Total Quote Value"
          value={formatCurrency(stats.totalQuoteValue)}
          icon={DollarSign}
          color="purple"
        />
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500 transition-transform hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Scheduled</p>
              <p className="text-2xl font-bold text-gray-900">{dispositionStats.scheduledLeads}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-500 opacity-50" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500 transition-transform hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Follow Up</p>
              <p className="text-2xl font-bold text-gray-900">{dispositionStats.followUpLeads}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500 opacity-50" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-indigo-500 transition-transform hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Insurance</p>
              <p className="text-2xl font-bold text-gray-900">{dispositionStats.insuranceLeads}</p>
            </div>
            <ClipboardList className="w-8 h-8 text-indigo-500 opacity-50" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-emerald-500 transition-transform hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Conversion</p>
              <p className="text-2xl font-bold text-gray-900">{dispositionStats.conversionRate}%</p>
            </div>
            <Percent className="w-8 h-8 text-emerald-500 opacity-50" />
          </div>
        </div>
      </div>

      {/* Job Count Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white cursor-pointer transition-all hover:shadow-xl hover:scale-105">
          <div className="flex items-center justify-between mb-2">
            <Calculator className="w-10 h-10 opacity-80" />
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <p className="text-sm opacity-90">Total Job Counts</p>
          <p className="text-4xl font-bold mt-1">{stats.totalJobCounts}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white cursor-pointer transition-all hover:shadow-xl hover:scale-105">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-10 h-10 opacity-80" />
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <p className="text-sm opacity-90">Total Square Feet</p>
          <p className="text-4xl font-bold mt-1">{formatNumber(stats.totalSqFt)}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white cursor-pointer transition-all hover:shadow-xl hover:scale-105">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-10 h-10 opacity-80" />
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <p className="text-sm opacity-90">Closed Deals</p>
          <p className="text-4xl font-bold mt-1">{dispositionStats.closedSold}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => onNavigateToTab('leads')}
            className="flex items-center justify-center px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors font-medium"
          >
            <ClipboardList className="w-5 h-5 mr-2" />
            View Leads
          </button>
          <button
            onClick={() => onNavigateToTab('jobcount')}
            className="flex items-center justify-center px-4 py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors font-medium"
          >
            <Calculator className="w-5 h-5 mr-2" />
            Job Counts
          </button>
          <button
            onClick={() => onNavigateToTab('map')}
            className="flex items-center justify-center px-4 py-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors font-medium"
          >
            <Map className="w-5 h-5 mr-2" />
            Map View
          </button>
          <button
            onClick={() => onNavigateToTab('calendar')}
            className="flex items-center justify-center px-4 py-3 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg transition-colors font-medium"
          >
            <Calendar className="w-5 h-5 mr-2" />
            Calendar
          </button>
        </div>
      </div>

      {/* Recent Activity - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Leads</h3>
            <button
              onClick={() => onNavigateToTab('leads')}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View All
            </button>
          </div>
          {recentLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500 font-medium">No leads yet</p>
              <p className="text-xs text-gray-400 mt-1">Add your first lead to get started!</p>
              <button
                onClick={() => onNavigateToTab('leads')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Lead
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentLeads.map((lead, index) => (
                <div key={lead.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{lead.customerName || `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Unknown'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        lead.quality === 'Hot' ? 'bg-red-100 text-red-800' :
                        lead.quality === 'Warm' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {lead.quality}
                      </span>
                      <span className="text-xs text-gray-600">{lead.disposition || 'New'}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{lead.dabellaQuote ? formatCurrency(parseFloat(String(lead.dabellaQuote).replace(/[$,]/g, '')) || 0) : 'N/A'}</p>
                    {lead.phoneNumber && (
                      <p className="text-xs text-gray-500 mt-1">{lead.phoneNumber}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Job Counts */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Job Counts</h3>
            <button
              onClick={() => onNavigateToTab('jobcount')}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View All
            </button>
          </div>
          {recentJobCounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Calculator className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500 font-medium">No job counts yet</p>
              <p className="text-xs text-gray-400 mt-1">Add your first job count!</p>
              <button
                onClick={() => onNavigateToTab('jobcount')}
                className="mt-4 px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
              >
                Add Job Count
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentJobCounts.map((job, index) => (
                <div key={job.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{job.customerName || `${job.firstName || ''} ${job.lastName || ''}`.trim() || 'Unknown'}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                      <span>{job.sqFt ? `${formatNumber(job.sqFt)} sq ft` : 'N/A'}</span>
                      {job.roofType && <span>• {job.roofType}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{job.date || 'N/A'}</p>
                    {job.dabellaQuote && (
                      <p className="font-semibold text-gray-900 mt-1">{formatCurrency(parseFloat(String(job.dabellaQuote).replace(/[$,]/g, '')) || 0)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pipeline Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Pipeline</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          <div className="text-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="text-2xl font-bold text-gray-900">{dispositionStats.newLeads}</div>
            <div className="text-sm text-gray-600 mt-1 font-medium">New</div>
          </div>
          <div className="text-center p-3 rounded-lg hover:bg-blue-50 transition-colors">
            <div className="text-2xl font-bold text-blue-600">{dispositionStats.scheduledLeads}</div>
            <div className="text-sm text-gray-600 mt-1 font-medium">Scheduled</div>
          </div>
          <div className="text-center p-3 rounded-lg hover:bg-indigo-50 transition-colors">
            <div className="text-2xl font-bold text-indigo-600">{dispositionStats.insuranceLeads}</div>
            <div className="text-sm text-gray-600 mt-1 font-medium">Insurance</div>
          </div>
          <div className="text-center p-3 rounded-lg hover:bg-purple-50 transition-colors">
            <div className="text-2xl font-bold text-purple-600">{stats.quotedLeads}</div>
            <div className="text-sm text-gray-600 mt-1 font-medium">Quoted</div>
          </div>
          <div className="text-center p-3 rounded-lg hover:bg-yellow-50 transition-colors">
            <div className="text-2xl font-bold text-yellow-600">{dispositionStats.followUpLeads}</div>
            <div className="text-sm text-gray-600 mt-1 font-medium">Follow Up</div>
          </div>
          <div className="text-center p-3 rounded-lg hover:bg-green-50 transition-colors">
            <div className="text-2xl font-bold text-green-600">{dispositionStats.closedSold}</div>
            <div className="text-sm text-gray-600 mt-1 font-medium">Closed Sold</div>
          </div>
        </div>
      </div>
    </div>
  );
}

DashboardView.propTypes = {
  stats: PropTypes.shape({
    totalLeads: PropTypes.number,
    hotLeads: PropTypes.number,
    quotedLeads: PropTypes.number,
    totalQuoteValue: PropTypes.number,
    totalJobCounts: PropTypes.number,
    totalSqFt: PropTypes.number
  }).isRequired,
  leads: PropTypes.arrayOf(PropTypes.object).isRequired,
  jobCounts: PropTypes.arrayOf(PropTypes.object),
  onNavigateToTab: PropTypes.func.isRequired,
  onRefresh: PropTypes.func
};

DashboardView.defaultProps = {
  jobCounts: [],
  onRefresh: null
};

export default DashboardView;