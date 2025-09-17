import React from 'react';
import { StatCard } from '../../components/StatCard';
import { DollarSign, Users, Target, TrendingUp } from 'lucide-react';

function DashboardView({ stats, leads }) {
  const recentLeads = leads.slice(0, 5);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  return (
    <div className="space-y-6">
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
                  <th className="text-left py-2 px-4 font-medium text-gray-700">Company</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-700">Quality</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-700">Disposition</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-700">Quote</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((lead, index) => (
                  <tr key={lead.id || index} className="border-b border-gray-100">
                    <td className="py-2 px-4 text-gray-900">{lead.firstName} {lead.lastName}</td>
                    <td className="py-2 px-4 text-gray-600">{lead.company || 'N/A'}</td>
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