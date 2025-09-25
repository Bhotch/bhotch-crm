import React, { useState } from 'react';
import { StatCard } from '../../components/StatCard';
import { DollarSign, Users, Target, TrendingUp, Zap } from 'lucide-react';
import RevolutionaryDashboard from './RevolutionaryDashboard';

function DashboardView({ stats, leads, jobCounts = [], onNavigateToTab }) {
  const [showRevolutionary, setShowRevolutionary] = useState(false);
  const recentLeads = leads.slice(0, 5);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  // Toggle between classic and revolutionary view
  if (showRevolutionary) {
    return <RevolutionaryDashboard leads={leads} jobCounts={jobCounts} onNavigateToTab={onNavigateToTab} />;
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Toggle */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <button
          onClick={() => setShowRevolutionary(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg hover:from-purple-600 hover:to-blue-700 transition-all duration-200 shadow-lg transform hover:scale-105"
        >
          <Zap className="h-4 w-4" />
          Revolutionary View
        </button>
      </div>

      {/* Stats Grid */}
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

      {/* Recent Leads */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Leads</h3>
        {recentLeads.length === 0 ? (
          <p className="text-gray-500">No leads yet. Add your first lead to get started!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-4 font-medium text-gray-700">Name</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-700">Quality</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-700">Disposition</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-700">Quote</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-700">Notes</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((lead, index) => (
                  <tr key={lead.id || index} className="border-b border-gray-100">
                    <td className="py-2 px-4 text-gray-900">{lead.customerName || `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Unknown'}</td>
                    <td className="py-2 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        lead.quality === 'Hot' ? 'bg-red-100 text-red-800' :
                        lead.quality === 'Warm' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {lead.quality}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-gray-600">{lead.disposition || 'New'}</td>
                    <td className="py-2 px-4 text-gray-900">{lead.dabellaQuote || 'N/A'}</td>
                    <td className="py-2 px-4 text-gray-600 max-w-xs truncate">{lead.notes || 'No notes'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardView;