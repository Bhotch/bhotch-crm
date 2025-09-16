import React, { useMemo } from 'react';
import { ClipboardList, AlertCircle, DollarSign, Briefcase } from 'lucide-react';

export const StatCard = React.memo(({ title, value, color }) => {
    const iconMap = {
        'Total Leads': <ClipboardList size={24} />,
        'Hot Leads': <AlertCircle size={24} />,
        'Quoted Leads': <DollarSign size={24} />,
        'Total Quote Value': <Briefcase size={24} />,
    };
    const colors = useMemo(() => ({ blue: 'bg-blue-100 text-blue-800', red: 'bg-red-100 text-red-800', green: 'bg-green-100 text-green-800', purple: 'bg-purple-100 text-purple-800' }), []);
    return (
        <div className="bg-white rounded-lg shadow p-5">
            <div className="flex items-center">
                <div className={`p-3 rounded-full ${colors[color]}`}>{iconMap[title]}</div>
                <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
                    <p className="text-2xl font-semibold text-gray-900">{value}</p>
                </div>
            </div>
        </div>
    );
});