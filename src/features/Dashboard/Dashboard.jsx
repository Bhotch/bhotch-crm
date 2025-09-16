import React, { useMemo } from 'react';
import { StatCard } from '../../components/StatCard';

export function DashboardView({ stats, leads }) {
  const recentLeads = useMemo(() => leads.slice(0, 5), [leads]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Leads" value={stats.totalLeads} color="blue" />
        <StatCard title="Hot Leads" value={stats.hotLeads} color="red" />
        <StatCard title="Quoted Leads" value={stats.quotedLeads} color="green" />
        <StatCard title="Total Quote Value" value={`$${stats.totalQuoteValue.toLocaleString()}`} color="purple" />
      </div>
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Leads</h3>
        </div>
        <div className="p-6">
          {recentLeads.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recent leads.</p>
          ) : (
            <div className="space-y-4">
              {recentLeads.map(lead => (
                <div key={lead.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div>
                    <h4 className="font-medium text-gray-900">{lead.customerName}</h4>
                    <p className="text-sm text-gray-500">{lead.leadSource} - {lead.disposition}</p>
                    <p className="text-sm font-medium text-green-600">{lead.dabellaQuote || "No Quote"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{lead.phoneNumber}</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${lead.quality === 'Hot' ? 'bg-red-100 text-red-800' : lead.quality === 'Warm' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{lead.quality}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}