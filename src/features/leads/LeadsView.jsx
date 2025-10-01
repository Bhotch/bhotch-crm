import React, { useState, useMemo, useCallback } from 'react';
import { Plus, Edit2, Eye, RefreshCw, XCircle, CheckCircle, Clock, AlertCircle, DollarSign, ShieldCheck, Search, Calendar, ChevronUp, ChevronDown, Filter, X, Settings, ChevronLeft, ChevronRight, Save } from 'lucide-react';

function LeadsView({ leads, onAddLead, onEditLead, onDeleteLead, onRefreshLeads, onSelectLead }) {
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
        // Basic Information (most important shown by default)
        id: false,
        date: true,
        createdDate: false,
        modifiedDate: false,
        customerName: true,
        firstName: false,
        lastName: false,
        phoneNumber: true,
        email: false,
        address: true,
        latitude: false,
        longitude: false,

        // Lead Information
        quality: true,
        disposition: true,
        leadSource: true,
        status: false,

        // Roof Information
        roofAge: false,
        roofType: false,

        // Measurements
        sqFt: true,
        ridgeLf: true,
        valleyLf: true,
        eavesLf: false,

        // Financial
        dabellaQuote: true,

        // Ventilation
        ridgeVents: false,
        turbine: false,
        rimeFlow: false,

        // Components
        highProfileRidgeCap: false,
        valleyMetal: false,

        // Pipes
        pipes1Half: false,
        pipes2: false,
        pipes3: false,
        pipes4: false,

        // Features
        gables: false,
        turtleBacks: false,
        satellite: false,
        chimney: false,
        solar: false,
        swampCooler: false,

        // Gutters
        guttersLf: false,
        downspouts: false,
        gutterGuardLf: false,

        // Additional
        permanentLighting: false,
        notes: false
    };

    // Load saved column preferences from localStorage
    const loadSavedColumns = () => {
        try {
            const saved = localStorage.getItem('leadsVisibleColumns');
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
            localStorage.setItem('leadsVisibleColumns', JSON.stringify(tempVisibleColumns));
            setVisibleColumns(tempVisibleColumns);
            setShowColumnSettings(false);
        } catch (error) {
            console.error('Error saving columns:', error);
        }
    }, [tempVisibleColumns]);

    const getStatusBadge = useCallback((status) => {
        const badges = {
            'New': { bg: 'bg-blue-100', text: 'text-blue-800', icon: Plus },
            'Scheduled': { bg: 'bg-cyan-100', text: 'text-cyan-800', icon: Calendar },
            'Insurance': { bg: 'bg-indigo-100', text: 'text-indigo-800', icon: ShieldCheck },
            'Quoted': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: DollarSign },
            'Follow Up': { bg: 'bg-orange-100', text: 'text-orange-800', icon: Clock },
            'Closed Sold': { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
            'Closed Lost': { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle }
        };
        const badge = badges[status] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: AlertCircle };
        const Icon = badge.icon;
        return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}><Icon className="w-3 h-3 mr-1" />{status}</span>;
    }, []);

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
        const phoneString = String(phone || '');
        if (!phoneString) return '-';
        const cleaned = phoneString.replace(/\D/g, '');
        if (cleaned.length === 10) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
        return phoneString;
    }, []);

    const handleSort = useCallback((key) => {
        setSortConfig(prevConfig => ({
            key,
            direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
        }));
    }, []);

    const availableColumns = useMemo(() => [
        // Basic Information
        { key: 'id', label: 'ID', type: 'text', category: 'Basic' },
        { key: 'date', label: 'Date', type: 'date', category: 'Basic' },
        { key: 'createdDate', label: 'Created Date', type: 'date', category: 'Basic' },
        { key: 'modifiedDate', label: 'Modified Date', type: 'date', category: 'Basic' },
        { key: 'customerName', label: 'Customer Name', type: 'text', category: 'Basic' },
        { key: 'firstName', label: 'First Name', type: 'text', category: 'Basic' },
        { key: 'lastName', label: 'Last Name', type: 'text', category: 'Basic' },
        { key: 'phoneNumber', label: 'Phone Number', type: 'text', category: 'Basic' },
        { key: 'email', label: 'Email', type: 'text', category: 'Basic' },
        { key: 'address', label: 'Address', type: 'text', category: 'Basic' },
        { key: 'latitude', label: 'Latitude', type: 'number', category: 'Basic' },
        { key: 'longitude', label: 'Longitude', type: 'number', category: 'Basic' },

        // Lead Information
        { key: 'quality', label: 'Quality', type: 'text', category: 'Lead Info' },
        { key: 'disposition', label: 'Disposition', type: 'text', category: 'Lead Info' },
        { key: 'leadSource', label: 'Lead Source', type: 'text', category: 'Lead Info' },
        { key: 'status', label: 'Status', type: 'text', category: 'Lead Info' },

        // Roof Information
        { key: 'roofAge', label: 'Roof Age', type: 'text', category: 'Roof Info' },
        { key: 'roofType', label: 'Roof Type', type: 'text', category: 'Roof Info' },

        // Measurements
        { key: 'sqFt', label: 'SQ FT', type: 'number', category: 'Measurements' },
        { key: 'ridgeLf', label: 'Ridge LF', type: 'number', category: 'Measurements' },
        { key: 'valleyLf', label: 'Valley LF', type: 'number', category: 'Measurements' },
        { key: 'eavesLf', label: 'Eaves LF', type: 'number', category: 'Measurements' },

        // Financial
        { key: 'dabellaQuote', label: 'DaBella Quote', type: 'number', category: 'Financial' },

        // Ventilation
        { key: 'ridgeVents', label: 'Ridge Vents', type: 'number', category: 'Ventilation' },
        { key: 'turbine', label: 'Turbine', type: 'number', category: 'Ventilation' },
        { key: 'rimeFlow', label: 'Rime Flow', type: 'number', category: 'Ventilation' },

        // Components
        { key: 'highProfileRidgeCap', label: 'High Profile Ridge Cap', type: 'number', category: 'Components' },
        { key: 'valleyMetal', label: 'Valley Metal', type: 'number', category: 'Components' },

        // Pipes
        { key: 'pipes1Half', label: 'Pipes 1.5"', type: 'number', category: 'Pipes' },
        { key: 'pipes2', label: 'Pipes 2"', type: 'number', category: 'Pipes' },
        { key: 'pipes3', label: 'Pipes 3"', type: 'number', category: 'Pipes' },
        { key: 'pipes4', label: 'Pipes 4"', type: 'number', category: 'Pipes' },

        // Features
        { key: 'gables', label: 'Gables', type: 'number', category: 'Features' },
        { key: 'turtleBacks', label: 'Turtle Backs', type: 'number', category: 'Features' },
        { key: 'satellite', label: 'Satellite', type: 'number', category: 'Features' },
        { key: 'chimney', label: 'Chimney', type: 'number', category: 'Features' },
        { key: 'solar', label: 'Solar', type: 'number', category: 'Features' },
        { key: 'swampCooler', label: 'Swamp Cooler', type: 'number', category: 'Features' },

        // Gutters
        { key: 'guttersLf', label: 'Gutters LF', type: 'number', category: 'Gutters' },
        { key: 'downspouts', label: 'Downspouts', type: 'number', category: 'Gutters' },
        { key: 'gutterGuardLf', label: 'Gutter Guard LF', type: 'number', category: 'Gutters' },

        // Additional
        { key: 'permanentLighting', label: 'Permanent Lighting', type: 'number', category: 'Additional' },
        { key: 'notes', label: 'Notes', type: 'text', category: 'Additional' }
    ], []);

    const getSortValue = useCallback((lead, key) => {
        const column = availableColumns.find(col => col.key === key);

        // Handle special field mappings
        if (key === 'customerName') {
            return lead.customerName || `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Unknown';
        }

        if (column?.type === 'number') {
            return parseFloat(lead[key]) || 0;
        }

        return lead[key] || '';
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
            setCurrentPage(1);
            return newFilters;
        });
    }, []);

    const clearAllFilters = useCallback(() => {
        setColumnFilters({});
        setSearchTerm('');
        setFilterDate('');
        setCurrentPage(1);
    }, []);

    const filteredAndSortedLeads = useMemo(() => {
        let filtered = leads.filter(lead => {
            // Global search filter
            const matchesSearch = !searchTerm || [
                lead.firstName,
                lead.lastName,
                lead.customerName,
                lead.phoneNumber?.toString(),
                lead.address,
                lead.quality,
                lead.disposition,
                lead.leadSource
            ].some(field => field?.toLowerCase().includes(searchTerm.toLowerCase()));

            // Date filter
            const matchesDate = !filterDate || lead.date === filterDate;

            // Column-specific filters
            const matchesColumnFilters = Object.entries(columnFilters).every(([column, filterValue]) => {
                if (!filterValue) return true;

                let leadValue;
                if (column === 'customerName') {
                    leadValue = lead.customerName || `${lead.firstName || ''} ${lead.lastName || ''}`.trim();
                } else {
                    const columnConfig = availableColumns.find(col => col.key === column);
                    if (columnConfig?.type === 'number') {
                        leadValue = parseFloat(lead[column]) || 0;
                    } else {
                        leadValue = lead[column] || '';
                    }
                }

                const columnConfig = availableColumns.find(col => col.key === column);
                if (columnConfig?.type === 'number') {
                    return leadValue >= parseFloat(filterValue);
                } else {
                    return leadValue.toString().toLowerCase().includes(filterValue.toLowerCase());
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
    }, [leads, searchTerm, filterDate, columnFilters, sortConfig, getSortValue, availableColumns]);

    const paginatedLeads = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredAndSortedLeads.slice(startIndex, endIndex);
    }, [filteredAndSortedLeads, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredAndSortedLeads.length / itemsPerPage);

    const hasActiveFilters = useMemo(() => {
        return searchTerm || filterDate || Object.keys(columnFilters).length > 0;
    }, [searchTerm, filterDate, columnFilters]);

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
        <div className="space-y-4 lg:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">Lead Management</h2>
                    <p className="text-sm lg:text-base text-gray-600 mt-1">Track and manage your sales leads</p>
                </div>
                <div className="flex items-center space-x-2 lg:space-x-3">
                    <button
                        onClick={onRefreshLeads}
                        className="inline-flex items-center px-3 lg:px-4 py-2 border border-gray-300 rounded-lg text-xs lg:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                        <RefreshCw className="w-3 h-3 lg:w-4 lg:h-4 lg:mr-2" />
                        <span className="hidden lg:inline">Refresh</span>
                    </button>
                    <button
                        onClick={onAddLead}
                        className="inline-flex items-center px-3 lg:px-4 py-2 border border-transparent rounded-lg text-xs lg:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
                        Add Lead
                    </button>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white p-3 lg:p-6 rounded-lg shadow-sm border">
                <div className="space-y-3 lg:space-y-4">
                    {/* Main Search and Date Filter */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-4">
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
                                Showing {filteredAndSortedLeads.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredAndSortedLeads.length)} of {filteredAndSortedLeads.length}
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

            {/* Leads Table */}
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
                            {paginatedLeads.map((lead, index) => (
                                <tr
                                    key={lead.id || index}
                                    className={`cursor-pointer transition-all duration-200 hover:bg-blue-50 hover:shadow-md transform hover:-translate-y-0.5 ${
                                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                    }`}
                                    onClick={() => onSelectLead(lead)}
                                >
                                    {availableColumns.filter(col => visibleColumns[col.key]).map(column => {
                                        const renderCellContent = () => {
                                            // Date columns
                                            if (column.key === 'date' || column.key === 'createdDate' || column.key === 'modifiedDate') {
                                                return <div className="text-sm font-medium text-gray-900">{formatDate(lead[column.key])}</div>;
                                            }

                                            // Customer Name
                                            if (column.key === 'customerName') {
                                                return (
                                                    <div className="text-sm font-semibold text-gray-900">
                                                        {lead.customerName || `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Unknown'}
                                                    </div>
                                                );
                                            }

                                            // Phone Number
                                            if (column.key === 'phoneNumber') {
                                                return (
                                                    <a
                                                        href={`tel:${lead.phoneNumber}`}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                                                    >
                                                        {formatPhone(lead.phoneNumber)}
                                                    </a>
                                                );
                                            }

                                            // Email
                                            if (column.key === 'email') {
                                                return lead.email ? (
                                                    <a
                                                        href={`mailto:${lead.email}`}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                                                    >
                                                        {lead.email}
                                                    </a>
                                                ) : '-';
                                            }

                                            // Address
                                            if (column.key === 'address') {
                                                return <div className="text-sm text-gray-700 truncate max-w-xs">{lead.address || '-'}</div>;
                                            }

                                            // Disposition
                                            if (column.key === 'disposition') {
                                                return getStatusBadge(lead.disposition);
                                            }

                                            // DaBella Quote
                                            if (column.key === 'dabellaQuote') {
                                                return lead.dabellaQuote ? (
                                                    <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                                                        ${formatNumber(lead.dabellaQuote)}
                                                    </span>
                                                ) : '-';
                                            }

                                            // Number columns
                                            if (column.type === 'number') {
                                                const value = lead[column.key];
                                                return value ? (
                                                    <div className="text-sm font-medium text-gray-900">{formatNumber(value)}</div>
                                                ) : '-';
                                            }

                                            // Default text rendering
                                            return <div className="text-sm text-gray-900">{lead[column.key] || '-'}</div>;
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
                                                onClick={(e) => { e.stopPropagation(); onSelectLead(lead); }}
                                                className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-100 transition-all duration-200 hover:scale-110"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onEditLead(lead); }}
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
                    {filteredAndSortedLeads.length === 0 && (
                        <div className="text-center py-12">
                            <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No leads found</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {hasActiveFilters
                                    ? 'Try adjusting your search or filter criteria.'
                                    : 'Get started by adding your first lead.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Pagination */}
            {filteredAndSortedLeads.length > 0 && totalPages > 1 && (
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

export default LeadsView;