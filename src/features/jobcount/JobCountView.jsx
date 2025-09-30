import React, { useState, useMemo, useCallback } from 'react';
import { Plus, Edit2, Eye, RefreshCw, Search, Calendar, Calculator, Users, TrendingUp, ChevronUp, ChevronDown, Filter, X, ChevronLeft, ChevronRight, Settings, Save } from 'lucide-react';

function JobCountView({ jobCounts, onAddJobCount, onEditJobCount, onDeleteJobCount, onRefreshJobCounts, onSelectJobCount }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [columnFilters, setColumnFilters] = useState({});
    const [showFilters, setShowFilters] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);
    const [showColumnSettings, setShowColumnSettings] = useState(false);

    // Default column visibility settings
    const defaultVisibleColumns = {
        date: true,
        customer: true,
        phone: true,
        address: true,
        email: false,
        sqFt: true,
        ridgeLf: true,
        valleyLf: true,
        eavesLf: false,
        quote: true,
        quality: true,
        disposition: true,
        leadSource: true,
        roofAge: false,
        roofType: false,
        ridgeVents: false,
        turbine: false,
        rimeFlow: false,
        highProfileRidgeCap: false,
        valleyMetal: false,
        pipes1Half: false,
        pipes2: false,
        pipes3: false,
        pipes4: false,
        gables: false,
        turtleBacks: false,
        satellite: false,
        chimney: false,
        solar: false,
        swampCooler: false,
        guttersLf: false,
        downspouts: false,
        gutterGuardLf: false,
        permanentLighting: false
    };

    // Load saved column preferences from localStorage
    const loadSavedColumns = () => {
        try {
            const saved = localStorage.getItem('jobCountVisibleColumns');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading saved columns:', error);
        }
        return defaultVisibleColumns;
    };

    const [visibleColumns, setVisibleColumns] = useState(loadSavedColumns);
    const [tempVisibleColumns, setTempVisibleColumns] = useState(loadSavedColumns);

    // Save column preferences to localStorage when save button is clicked
    const handleSaveColumns = useCallback(() => {
        try {
            localStorage.setItem('jobCountVisibleColumns', JSON.stringify(tempVisibleColumns));
            setVisibleColumns(tempVisibleColumns);
            setShowColumnSettings(false);
        } catch (error) {
            console.error('Error saving columns:', error);
        }
    }, [tempVisibleColumns]);

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

    const handleSort = useCallback((key) => {
        setSortConfig(prevConfig => ({
            key,
            direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
        }));
    }, []);

    const availableColumns = useMemo(() => [
        { key: 'date', label: 'Date', type: 'date', category: 'Basic' },
        { key: 'customer', label: 'Customer', type: 'text', category: 'Basic' },
        { key: 'phone', label: 'Phone', type: 'text', category: 'Basic' },
        { key: 'email', label: 'Email', type: 'text', category: 'Basic' },
        { key: 'address', label: 'Address', type: 'text', category: 'Basic' },
        { key: 'quality', label: 'Quality', type: 'text', category: 'Job Info' },
        { key: 'disposition', label: 'Disposition', type: 'text', category: 'Job Info' },
        { key: 'leadSource', label: 'Lead Source', type: 'text', category: 'Job Info' },
        { key: 'roofAge', label: 'Roof Age', type: 'text', category: 'Job Info' },
        { key: 'roofType', label: 'Roof Type', type: 'text', category: 'Job Info' },
        { key: 'sqFt', label: 'SQ FT', type: 'number', category: 'Measurements' },
        { key: 'ridgeLf', label: 'Ridge LF', type: 'number', category: 'Measurements' },
        { key: 'valleyLf', label: 'Valley LF', type: 'number', category: 'Measurements' },
        { key: 'eavesLf', label: 'Eaves LF', type: 'number', category: 'Measurements' },
        { key: 'quote', label: 'Quote', type: 'number', category: 'Financial' },
        { key: 'ridgeVents', label: 'Ridge Vents', type: 'number', category: 'Ventilation' },
        { key: 'turbine', label: 'Turbine', type: 'number', category: 'Ventilation' },
        { key: 'rimeFlow', label: 'Rime Flow', type: 'number', category: 'Ventilation' },
        { key: 'highProfileRidgeCap', label: 'High Profile Ridge Cap', type: 'number', category: 'Components' },
        { key: 'valleyMetal', label: 'Valley Metal', type: 'number', category: 'Components' },
        { key: 'pipes1Half', label: 'Pipes 1.5"', type: 'number', category: 'Pipes' },
        { key: 'pipes2', label: 'Pipes 2"', type: 'number', category: 'Pipes' },
        { key: 'pipes3', label: 'Pipes 3"', type: 'number', category: 'Pipes' },
        { key: 'pipes4', label: 'Pipes 4"', type: 'number', category: 'Pipes' },
        { key: 'gables', label: 'Gables', type: 'number', category: 'Features' },
        { key: 'turtleBacks', label: 'Turtle Backs', type: 'number', category: 'Features' },
        { key: 'satellite', label: 'Satellite', type: 'number', category: 'Features' },
        { key: 'chimney', label: 'Chimney', type: 'number', category: 'Features' },
        { key: 'solar', label: 'Solar', type: 'number', category: 'Features' },
        { key: 'swampCooler', label: 'Swamp Cooler', type: 'number', category: 'Features' },
        { key: 'guttersLf', label: 'Gutters LF', type: 'number', category: 'Gutters' },
        { key: 'downspouts', label: 'Downspouts', type: 'number', category: 'Gutters' },
        { key: 'gutterGuardLf', label: 'Gutter Guard LF', type: 'number', category: 'Gutters' },
        { key: 'permanentLighting', label: 'Permanent Lighting', type: 'number', category: 'Additional' }
    ], []);

    const getSortValue = useCallback((job, key) => {
        const column = availableColumns.find(col => col.key === key);

        if (key === 'customer') {
            return job.customerName || `${job.firstName || ''} ${job.lastName || ''}`.trim() || 'Unknown';
        }
        if (key === 'phone') {
            return job.phoneNumber || '';
        }
        if (key === 'quote') {
            return parseFloat(job.dabellaQuote) || 0;
        }

        if (column?.type === 'number') {
            return parseFloat(job[key]) || 0;
        }

        return job[key] || '';
    }, [availableColumns]);

    const toggleColumnVisibility = useCallback((columnKey) => {
        setTempVisibleColumns(prev => ({
            ...prev,
            [columnKey]: !prev[columnKey]
        }));
    }, []);

    const updateColumnFilter = useCallback((column, value) => {
        setColumnFilters(prev => {
            const newFilters = { ...prev };
            if (value === '' || value === null || value === undefined) {
                delete newFilters[column];
            } else {
                newFilters[column] = value;
            }
            setCurrentPage(1); // Reset to first page when filtering
            return newFilters;
        });
    }, []);

    const clearAllFilters = useCallback(() => {
        setColumnFilters({});
        setSearchTerm('');
        setFilterDate('');
        setCurrentPage(1);
    }, []);

    const filteredAndSortedJobCounts = useMemo(() => {
        let filtered = jobCounts.filter(job => {
            // Global search filter
            const matchesSearch = !searchTerm || [
                job.firstName,
                job.lastName,
                job.customerName,
                job.phoneNumber?.toString(),
                job.address,
                job.quality,
                job.disposition,
                job.leadSource
            ].some(field => field?.toLowerCase().includes(searchTerm.toLowerCase()));

            // Date filter
            const matchesDate = !filterDate || job.date === filterDate;

            // Column-specific filters
            const matchesColumnFilters = Object.entries(columnFilters).every(([column, filterValue]) => {
                if (!filterValue) return true;

                let jobValue;
                if (column === 'customer') {
                    jobValue = job.customerName || `${job.firstName || ''} ${job.lastName || ''}`.trim();
                } else if (column === 'phone') {
                    jobValue = job.phoneNumber?.toString() || '';
                } else if (column === 'quote') {
                    jobValue = parseFloat(job.dabellaQuote) || 0;
                } else {
                    const columnConfig = availableColumns.find(col => col.key === column);
                    if (columnConfig?.type === 'number') {
                        jobValue = parseFloat(job[column]) || 0;
                    } else {
                        jobValue = job[column] || '';
                    }
                }

                const columnConfig = availableColumns.find(col => col.key === column);
                if (columnConfig?.type === 'number') {
                    return jobValue >= parseFloat(filterValue);
                } else {
                    return jobValue.toString().toLowerCase().includes(filterValue.toLowerCase());
                }
            });

            return matchesSearch && matchesDate && matchesColumnFilters;
        });

        if (sortConfig.key) {
            filtered.sort((a, b) => {
                const aValue = getSortValue(a, sortConfig.key);
                const bValue = getSortValue(b, sortConfig.key);

                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    const comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
                    return sortConfig.direction === 'asc' ? comparison : -comparison;
                } else {
                    const comparison = aValue - bValue;
                    return sortConfig.direction === 'asc' ? comparison : -comparison;
                }
            });
        }

        return filtered;
    }, [jobCounts, searchTerm, filterDate, columnFilters, sortConfig, getSortValue, availableColumns]);

    const paginatedJobCounts = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredAndSortedJobCounts.slice(startIndex, endIndex);
    }, [filteredAndSortedJobCounts, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredAndSortedJobCounts.length / itemsPerPage);

    const hasActiveFilters = useMemo(() => {
        return searchTerm || filterDate || Object.keys(columnFilters).length > 0;
    }, [searchTerm, filterDate, columnFilters]);

    const summaryStats = useMemo(() => {
        return filteredAndSortedJobCounts.reduce((stats, job) => {
            stats.totalJobs += 1;
            stats.totalSqFt += parseFloat(job.sqFt) || 0;
            stats.totalRidgeLf += parseFloat(job.ridgeLf) || 0;
            stats.totalValleyLf += parseFloat(job.valleyLf) || 0;
            return stats;
        }, { totalJobs: 0, totalSqFt: 0, totalRidgeLf: 0, totalValleyLf: 0 });
    }, [filteredAndSortedJobCounts]);

    const SortableHeader = ({ sortKey, children, className = "" }) => {
        const hasFilter = columnFilters[sortKey];
        return (
            <th className={`px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`}>
                <div className="space-y-2">
                    <div
                        className="flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors select-none p-1 rounded"
                        onClick={() => handleSort(sortKey)}
                    >
                        <span className={hasFilter ? 'text-blue-600 font-semibold' : ''}>{children}</span>
                        <div className="flex items-center space-x-1">
                            {hasFilter && <Filter className="w-3 h-3 text-blue-600" />}
                            <div className="flex flex-col">
                                <ChevronUp
                                    className={`w-3 h-3 ${sortConfig.key === sortKey && sortConfig.direction === 'asc' ? 'text-blue-600' : 'text-gray-300'}`}
                                />
                                <ChevronDown
                                    className={`w-3 h-3 -mt-1 ${sortConfig.key === sortKey && sortConfig.direction === 'desc' ? 'text-blue-600' : 'text-gray-300'}`}
                                />
                            </div>
                        </div>
                    </div>
                    {showFilters && (
                        <ColumnFilter
                            column={sortKey}
                            value={columnFilters[sortKey] || ''}
                            onChange={(value) => updateColumnFilter(sortKey, value)}
                            type={availableColumns.find(col => col.key === sortKey)?.type || 'text'}
                        />
                    )}
                </div>
            </th>
        );
    };

    const ColumnFilter = ({ column, value, onChange, type }) => {
        const placeholder = type === 'number' ? 'Min value...' : 'Filter...';
        return (
            <div className="relative">
                <input
                    type={type === 'number' ? 'number' : type === 'date' ? 'date' : 'text'}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    onClick={(e) => e.stopPropagation()}
                />
                {value && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onChange('');
                        }}
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-3 h-3" />
                    </button>
                )}
            </div>
        );
    };

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
                <div className="space-y-4">
                    {/* Main Search and Date Filter */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative md:col-span-2">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search across all fields..."
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

                    {/* Filter Controls */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`inline-flex items-center px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                                    showFilters
                                        ? 'border-blue-500 text-blue-700 bg-blue-50'
                                        : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                                }`}
                            >
                                <Filter className="w-4 h-4 mr-2" />
                                Column Filters
                                {Object.keys(columnFilters).length > 0 && (
                                    <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                        {Object.keys(columnFilters).length}
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={() => setShowColumnSettings(!showColumnSettings)}
                                className={`inline-flex items-center px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                                    showColumnSettings
                                        ? 'border-purple-500 text-purple-700 bg-purple-50'
                                        : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                                }`}
                            >
                                <Settings className="w-4 h-4 mr-2" />
                                Manage Columns
                                <span className="ml-2 bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                                    {Object.values(visibleColumns).filter(Boolean).length}
                                </span>
                            </button>

                            {hasActiveFilters && (
                                <button
                                    onClick={clearAllFilters}
                                    className="inline-flex items-center px-3 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    Clear All Filters
                                </button>
                            )}
                        </div>

                        <div className="flex items-center space-x-3">
                            <select
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value={10}>10 per page</option>
                                <option value={25}>25 per page</option>
                                <option value={50}>50 per page</option>
                                <option value={100}>100 per page</option>
                            </select>

                            <div className="text-sm text-gray-600">
                                Showing {filteredAndSortedJobCounts.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredAndSortedJobCounts.length)} of {filteredAndSortedJobCounts.length}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Column Settings Panel */}
            {showColumnSettings && (
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Manage Visible Columns</h3>
                        <button
                            onClick={() => {
                                setTempVisibleColumns(visibleColumns);
                                setShowColumnSettings(false);
                            }}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
                        {availableColumns.map(column => (
                            <label
                                key={column.key}
                                className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                            >
                                <input
                                    type="checkbox"
                                    checked={tempVisibleColumns[column.key]}
                                    onChange={() => toggleColumnVisibility(column.key)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">{column.label}</span>
                            </label>
                        ))}
                    </div>
                    <div className="flex justify-end space-x-3 pt-4 border-t">
                        <button
                            onClick={() => {
                                setTempVisibleColumns(visibleColumns);
                                setShowColumnSettings(false);
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveColumns}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            Save Column Selection
                        </button>
                    </div>
                </div>
            )}

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
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                            <tr>
                                {availableColumns.filter(col => visibleColumns[col.key]).map(column => (
                                    <SortableHeader key={column.key} sortKey={column.key}>
                                        {column.label}
                                    </SortableHeader>
                                ))}
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {paginatedJobCounts.map((job, index) => (
                                <tr
                                    key={job.id || index}
                                    className={`cursor-pointer transition-all duration-200 hover:bg-blue-50 hover:shadow-md transform hover:-translate-y-0.5 ${
                                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                    }`}
                                    onClick={() => onSelectJobCount(job)}
                                >
                                    {availableColumns.filter(col => visibleColumns[col.key]).map(column => {
                                        const renderCellContent = () => {
                                            if (column.key === 'date') {
                                                return <div className="text-sm font-medium text-gray-900">{formatDate(job.date)}</div>;
                                            }
                                            if (column.key === 'customer') {
                                                return (
                                                    <div className="text-sm font-semibold text-gray-900">
                                                        {job.customerName || `${job.firstName || ''} ${job.lastName || ''}`.trim() || 'Unknown'}
                                                    </div>
                                                );
                                            }
                                            if (column.key === 'phone') {
                                                return (
                                                    <a
                                                        href={`tel:${job.phoneNumber}`}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                                                    >
                                                        {formatPhone(job.phoneNumber)}
                                                    </a>
                                                );
                                            }
                                            if (column.key === 'email') {
                                                return job.email ? (
                                                    <a
                                                        href={`mailto:${job.email}`}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                                                    >
                                                        {job.email}
                                                    </a>
                                                ) : '-';
                                            }
                                            if (column.key === 'address') {
                                                return <div className="text-sm text-gray-700 truncate max-w-xs">{job.address || '-'}</div>;
                                            }
                                            if (column.key === 'quote') {
                                                return job.dabellaQuote ? (
                                                    <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                                                        ${formatNumber(job.dabellaQuote)}
                                                    </span>
                                                ) : '-';
                                            }
                                            if (column.type === 'number') {
                                                const value = job[column.key];
                                                return value ? (
                                                    <div className="text-sm font-medium text-gray-900">{formatNumber(value)}</div>
                                                ) : '-';
                                            }
                                            return <div className="text-sm text-gray-900">{job[column.key] || '-'}</div>;
                                        };

                                        return (
                                            <td key={column.key} className="px-6 py-5 whitespace-nowrap">
                                                {renderCellContent()}
                                            </td>
                                        );
                                    })}
                                    <td className="px-6 py-5 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center space-x-3">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onSelectJobCount(job); }}
                                                className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-100 transition-all duration-200 hover:scale-110"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onEditJobCount(job); }}
                                                className="text-orange-600 hover:text-orange-900 p-2 rounded-lg hover:bg-orange-100 transition-all duration-200 hover:scale-110"
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
                    {filteredAndSortedJobCounts.length === 0 && (
                        <div className="text-center py-12">
                            <Calculator className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No job counts found</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {hasActiveFilters
                                    ? 'Try adjusting your search or filter criteria.'
                                    : 'Get started by adding your first job count.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Pagination */}
            {filteredAndSortedJobCounts.length > 0 && totalPages > 1 && (
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                First
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" />
                                Previous
                            </button>
                        </div>

                        <div className="flex items-center space-x-1">
                            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 7) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 4) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 3) {
                                    pageNum = totalPages - 6 + i;
                                } else {
                                    pageNum = currentPage - 3 + i;
                                }

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`px-3 py-2 text-sm font-medium rounded-lg ${
                                            currentPage === pageNum
                                                ? 'bg-blue-600 text-white'
                                                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </button>
                            <button
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Last
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default JobCountView;