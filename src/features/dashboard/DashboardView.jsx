import React from 'react';
import { StatCard } from '../../components/StatCard';
import { DollarSign, Users, Target, TrendingUp } from 'lucide-react';

function DashboardView({ stats, leads, jobCounts = [], onNavigateToTab }) {
  const recentLeads = leads.slice(0, 5);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };


  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Dashboard Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-sm lg:text-base text-gray-600 mt-1">Welcome to your roofing business overview</p>
        </div>
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
      <div className="bg-white rounded-lg shadow p-4 lg:p-6">
        <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">Recent Leads</h3>
        {recentLeads.length === 0 ? (
          <p className="text-sm lg:text-base text-gray-500">No leads yet. Add your first lead to get started!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 lg:px-4 font-medium text-gray-700 text-xs lg:text-sm">Name</th>
                  <th className="text-left py-2 px-2 lg:px-4 font-medium text-gray-700 text-xs lg:text-sm">Quality</th>
                  <th className="text-left py-2 px-2 lg:px-4 font-medium text-gray-700 text-xs lg:text-sm hidden sm:table-cell">Disposition</th>
                  <th className="text-left py-2 px-2 lg:px-4 font-medium text-gray-700 text-xs lg:text-sm">Quote</th>
                  <th className="text-left py-2 px-2 lg:px-4 font-medium text-gray-700 text-xs lg:text-sm hidden md:table-cell">Notes</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((lead, index) => (
                  <tr key={lead.id || index} className="border-b border-gray-100">
                    <td className="py-2 px-2 lg:px-4 text-gray-900 text-xs lg:text-sm">{lead.customerName || `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Unknown'}</td>
                    <td className="py-2 px-2 lg:px-4">
                      <span className={`px-1.5 lg:px-2 py-0.5 lg:py-1 rounded-full text-xs font-medium ${
                        lead.quality === 'Hot' ? 'bg-red-100 text-red-800' :
                        lead.quality === 'Warm' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {lead.quality}
                      </span>
                    </td>
                    <td className="py-2 px-2 lg:px-4 text-gray-600 text-xs lg:text-sm hidden sm:table-cell">{lead.disposition || 'New'}</td>
                    <td className="py-2 px-2 lg:px-4 text-gray-900 text-xs lg:text-sm">{lead.dabellaQuote || 'N/A'}</td>
                    <td className="py-2 px-2 lg:px-4 text-gray-600 text-xs lg:text-sm max-w-xs truncate hidden md:table-cell">{lead.notes || 'No notes'}</td>
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