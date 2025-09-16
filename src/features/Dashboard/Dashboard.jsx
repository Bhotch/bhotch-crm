// src/features/Dashboard/Dashboard.jsx

import { useMemo } from 'react';
import { User, TrendingUp, CheckCircle, Clock } from 'lucide-react';
// These components would be in your src/components/ folder
// For brevity, I'm assuming they exist. We will define them in App.jsx for now.

// Placeholder StatCard until you move it to its own file
const StatCard = ({ title, value, icon, color }) => (
    <div className={`bg-white rounded-lg shadow p-5 border-l-4 border-${color}-500`}>
        <div className="flex items-center">
            <div className={`p-3 rounded-full bg-${color}-100 text-${color}-800`}>{icon}</div>
            <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
                <p className="text-2xl font-semibold text-gray-900">{value}</p>
            </div>
        </div>
    </div>
);

const LeadsTable = ({ leads }) => (
  <div className="overflow-hidden bg-white shadow rounded-lg">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Added</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {leads.map((lead) => (
            <tr key={lead.id}>
              <td className="px-6 py-4"><div className="text-sm font-medium text-gray-900">{lead.customerName}</div><div className="text-sm text-gray-500">{lead.address || 'No address'}</div></td>
              <td className="px-6 py-4"><div className="text-sm text-gray-900">{lead.phone || 'No phone'}</div><div className="text-sm text-gray-500">{lead.email || 'No email'}</div></td>
              <td className="px-6 py-4"><span className={`inline-flex rounded-full px-2 text-xs font-semibold ${lead.status === 'new' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{lead.status}</span></td>
              <td className="px-6 py-4 text-sm text-gray-500">{new Date(lead.createdDate).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export function Dashboard({ leads }) {
  const stats = useMemo(() => ({
    totalLeads: leads.length,
    activeLeads: leads.filter(l => ['active', 'new'].includes(l.status)).length,
    closedLeads: leads.filter(l => ['closed', 'won'].includes(l.status)).length,
    pendingLeads: leads.filter(l => ['pending', 'contacted'].includes(l.status)).length,
  }), [leads]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Leads" value={stats.totalLeads} icon={<User />} color="blue" />
        <StatCard title="Active Leads" value={stats.activeLeads} icon={<TrendingUp />} color="green" />
        <StatCard title="Closed Deals" value={stats.closedLeads} icon={<CheckCircle />} color="purple" />
        <StatCard title="Pending" value={stats.pendingLeads} icon={<Clock />} color="red" />
      </div>
      <LeadsTable leads={leads} />
    </div>
  );
}