import React, { useState, useMemo, useCallback } from 'react';
import { Plus, Edit2, Eye, RefreshCw, Search, Calendar, Calculator, Users, TrendingUp, BarChart3 } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';

function JobCountView({ jobCounts, onAddJobCount, onEditJobCount, onDeleteJobCount, onRefreshJobCounts, onSelectJobCount }) {
    const { addNotification } = useNotifications();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDate, setFilterDate] = useState('');

    const formatNumber = useCallback((value) => {
        if (!value || value === '0' || value === '-') return '-';
        return Number(value).toLocaleString();
    }, []);

    const formatDate = useCallback((dateString) => {
        if (!dateString) return '-';
        try {
            return new Date(dateString).toLocaleDateString();
        } catch {
            return dateString;
        }
    }, []);

    const formatPhone = useCallback((phone) => {
        if (!phone) return '-';
        const cleaned = phone.toString().replace(/\D/g, '');
        if (cleaned.length === 10) {
            return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
        }
        return phone;
    }, []);

    const filteredJobCounts = useMemo(() => {
        return jobCounts.filter(job => {
            const matchesSearch =
                job.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                job.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                job.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                job.phoneNumber?.toString().includes(searchTerm) ||
                job.address?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesDate = !filterDate || job.date === filterDate;

            return matchesSearch && matchesDate;
        });
    }, [jobCounts, searchTerm, filterDate]);

    const summaryStats = useMemo(() => {
        return filteredJobCounts.reduce((stats, job) => {
            stats.totalJobs += 1;
            stats.totalSqFt += parseFloat(job.sqFt) || 0;
            stats.totalRidgeLf += parseFloat(job.ridgeLf) || 0;
            stats.totalValleyLf += parseFloat(job.valleyLf) || 0;
            return stats;
        }, { totalJobs: 0, totalSqFt: 0, totalRidgeLf: 0, totalValleyLf: 0 });
    }, [filteredJobCounts]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Job Count Management</h2>
                    <p className="text-gray-600 mt-1">Track roofing job counts, measurements, and customer information</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={onRefreshJobCounts}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </button>
                    <button
                        onClick={onAddJobCount}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Job Count
                    </button>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative md:col-span-2">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by name, phone, or address..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <Users className="h-8 w-8 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                            <p className="text-2xl font-bold text-gray-900">{summaryStats.totalJobs}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <Calculator className="h-8 w-8 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total SQ FT</p>
                            <p className="text-2xl font-bold text-gray-900">{formatNumber(summaryStats.totalSqFt)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <TrendingUp className="h-8 w-8 text-purple-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Ridge LF</p>
                            <p className="text-2xl font-bold text-gray-900">{formatNumber(summaryStats.totalRidgeLf)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <TrendingUp className="h-8 w-8 text-orange-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Valley LF</p>
                            <p className="text-2xl font-bold text-gray-900">{formatNumber(summaryStats.totalValleyLf)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Job Counts Table */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SQ FT</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ridge LF</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valley LF</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quote</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredJobCounts.map((job, index) => (
                                <tr
                                    key={job.id || index}
                                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                                    onClick={() => onSelectJobCount(job)}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <div className="text-sm font-medium text-gray-900">
                                                {job.customerName || `${job.firstName || ''} ${job.lastName || ''}`.trim() || 'Unknown'}
                                            </div>
                                            {job.address && (
                                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                                    {job.address}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <a
                                            href={`tel:${job.phoneNumber}`}
                                            onClick={(e) => e.stopPropagation()}
                                            className="text-sm text-blue-600 hover:text-blue-800"
                                        >
                                            {formatPhone(job.phoneNumber)}
                                        </a>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{formatDate(job.date)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{formatNumber(job.sqFt)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{formatNumber(job.ridgeLf)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{formatNumber(job.valleyLf)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {job.dabellaQuote ? `$${formatNumber(job.dabellaQuote)}` : '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onSelectJobCount(job); }}
                                                className="text-blue-600 hover:text-blue-900 p-2 rounded-md hover:bg-blue-50 transition-colors"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onEditJobCount(job); }}
                                                className="text-orange-600 hover:text-orange-900 p-2 rounded-md hover:bg-orange-50 transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredJobCounts.length === 0 && (
                        <div className="text-center py-12">
                            <Calculator className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No job counts found</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {searchTerm || filterDate
                                    ? 'Try adjusting your search or filter criteria.'
                                    : 'Get started by adding your first job count.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default JobCountView;