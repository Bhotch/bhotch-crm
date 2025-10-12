import React, { useState, useMemo, useCallback } from 'react';
import { Plus, Search, Calculator, Save, X } from 'lucide-react';
import VentilationCalculator from '../../components/VentilationCalculator';

function JobCountView({ leads, onUpdateLead, onAddLead }) {
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [formData, setFormData] = useState({});
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Filter leads for dropdown based on search term
    const filteredLeads = useMemo(() => {
        if (!searchTerm) return leads;
        return leads.filter(lead =>
            lead.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.phoneNumber?.includes(searchTerm)
        );
    }, [leads, searchTerm]);

    // Get selected customer data
    const selectedCustomer = useMemo(() => {
        return leads.find(lead => lead.id === selectedCustomerId);
    }, [leads, selectedCustomerId]);

    // Initialize form data when customer is selected
    const handleCustomerSelect = useCallback((customerId) => {
        setSelectedCustomerId(customerId);
        setIsAddingNew(false);
        setHasUnsavedChanges(false);
        const customer = leads.find(lead => lead.id === customerId);
        if (customer) {
            setFormData({
                // Core measurements
                sqft: customer.sqft || '',
                ridgeLf: customer.ridgeLf || '',
                valleyLf: customer.valleyLf || '',
                eavesLf: customer.eavesLf || '',

                // Ventilation
                ridgeVents: customer.ridgeVents || 0,
                turbineVents: customer.turbineVents || 0,
                rimeFlow: customer.rimeFlow || '',

                // Pipes
                pipes12: customer.pipes12 || 0,
                pipes34: customer.pipes34 || 0,

                // Roof features
                gables: customer.gables || 0,
                turtleBacks: customer.turtleBacks || 0,
                satellite: customer.satellite || false,
                chimney: customer.chimney || false,
                solar: customer.solar || false,
                swampCooler: customer.swampCooler || false,

                // Gutters
                gutterLf: customer.gutterLf || '',
                downspouts: customer.downspouts || 0,
                gutterGuardLf: customer.gutterGuardLf || '',

                // Additional
                permanentLighting: customer.permanentLighting || '',
                quoteAmount: customer.quoteAmount || '',
                quoteNotes: customer.quoteNotes || ''
            });
        }
    }, [leads]);

    const handleStartAddNew = () => {
        setIsAddingNew(true);
        setSelectedCustomerId('');
        setHasUnsavedChanges(false);
        setFormData({
            // Customer info
            customerName: '',
            firstName: '',
            lastName: '',
            phoneNumber: '',
            email: '',
            address: '',

            // Job count fields
            sqft: '',
            ridgeLf: '',
            valleyLf: '',
            eavesLf: '',
            ridgeVents: 0,
            turbineVents: 0,
            rimeFlow: '',
            pipes12: 0,
            pipes34: 0,
            gables: 0,
            turtleBacks: 0,
            satellite: false,
            chimney: false,
            solar: false,
            swampCooler: false,
            gutterLf: '',
            downspouts: 0,
            gutterGuardLf: '',
            permanentLighting: '',
            quoteAmount: '',
            quoteNotes: ''
        });
    };

    const handleFieldChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setHasUnsavedChanges(true);
    };

    const handleSave = async () => {
        if (isAddingNew) {
            // Create new lead with job count data
            const newLead = {
                customerName: formData.customerName || `${formData.firstName || ''} ${formData.lastName || ''}`.trim(),
                firstName: formData.firstName,
                lastName: formData.lastName,
                phoneNumber: formData.phoneNumber,
                email: formData.email,
                address: formData.address,

                // Job count data
                sqft: parseFloat(formData.sqft) || null,
                ridgeLf: parseFloat(formData.ridgeLf) || null,
                valleyLf: parseFloat(formData.valleyLf) || null,
                eavesLf: parseFloat(formData.eavesLf) || null,
                ridgeVents: parseInt(formData.ridgeVents) || 0,
                turbineVents: parseInt(formData.turbineVents) || 0,
                rimeFlow: parseFloat(formData.rimeFlow) || null,
                pipes12: parseInt(formData.pipes12) || 0,
                pipes34: parseInt(formData.pipes34) || 0,
                gables: parseInt(formData.gables) || 0,
                turtleBacks: parseInt(formData.turtleBacks) || 0,
                satellite: Boolean(formData.satellite),
                chimney: Boolean(formData.chimney),
                solar: Boolean(formData.solar),
                swampCooler: Boolean(formData.swampCooler),
                gutterLf: parseFloat(formData.gutterLf) || null,
                downspouts: parseInt(formData.downspouts) || 0,
                gutterGuardLf: parseFloat(formData.gutterGuardLf) || null,
                permanentLighting: formData.permanentLighting,
                quoteAmount: parseFloat(formData.quoteAmount) || null,
                quoteNotes: formData.quoteNotes
            };

            await onAddLead(newLead);
            setIsAddingNew(false);
            setHasUnsavedChanges(false);
        } else {
            // Update existing lead
            const updatedLead = {
                ...selectedCustomer,
                sqft: parseFloat(formData.sqft) || null,
                ridgeLf: parseFloat(formData.ridgeLf) || null,
                valleyLf: parseFloat(formData.valleyLf) || null,
                eavesLf: parseFloat(formData.eavesLf) || null,
                ridgeVents: parseInt(formData.ridgeVents) || 0,
                turbineVents: parseInt(formData.turbineVents) || 0,
                rimeFlow: parseFloat(formData.rimeFlow) || null,
                pipes12: parseInt(formData.pipes12) || 0,
                pipes34: parseInt(formData.pipes34) || 0,
                gables: parseInt(formData.gables) || 0,
                turtleBacks: parseInt(formData.turtleBacks) || 0,
                satellite: Boolean(formData.satellite),
                chimney: Boolean(formData.chimney),
                solar: Boolean(formData.solar),
                swampCooler: Boolean(formData.swampCooler),
                gutterLf: parseFloat(formData.gutterLf) || null,
                downspouts: parseInt(formData.downspouts) || 0,
                gutterGuardLf: parseFloat(formData.gutterGuardLf) || null,
                permanentLighting: formData.permanentLighting,
                quoteAmount: parseFloat(formData.quoteAmount) || null,
                quoteNotes: formData.quoteNotes
            };

            await onUpdateLead(updatedLead);
            setHasUnsavedChanges(false);
        }
    };

    const handleCancel = () => {
        if (isAddingNew) {
            setIsAddingNew(false);
            setFormData({});
        } else if (selectedCustomerId) {
            handleCustomerSelect(selectedCustomerId);
        }
        setHasUnsavedChanges(false);
    };

    const FormField = ({ label, field, type = 'number', step = '0.01', helpText, placeholder }) => (
        <div>
            <label htmlFor={field} className="block text-sm font-medium text-gray-700 mb-1">
                {label}
                {helpText && <span className="text-gray-500 text-xs ml-1">({helpText})</span>}
            </label>
            <input
                id={field}
                name={field}
                type={type}
                value={formData[field] || ''}
                onChange={(e) => handleFieldChange(field, e.target.value)}
                step={step}
                placeholder={placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
        </div>
    );

    const CheckboxField = ({ label, field }) => (
        <label htmlFor={field} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
            <input
                id={field}
                name={field}
                type="checkbox"
                checked={formData[field] || false}
                onChange={(e) => handleFieldChange(field, e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">{label}</span>
        </label>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Job Count</h2>
                    <p className="text-base text-gray-600 mt-1">Detailed measurements and specifications for each customer</p>
                </div>
                <button
                    onClick={handleStartAddNew}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Count
                </button>
            </div>

            {/* Customer Selection */}
            {!isAddingNew && (
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Customer
                    </label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                        <input
                            id="customer-search"
                            name="customer-search"
                            type="text"
                            placeholder="Search customers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-2"
                            aria-label="Search customers"
                        />
                    </div>
                    <select
                        id="customer-select"
                        value={selectedCustomerId}
                        onChange={(e) => handleCustomerSelect(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    >
                        <option value="">-- Select a customer --</option>
                        {filteredLeads.map(lead => (
                            <option key={lead.id} value={lead.id}>
                                {lead.customerName || `${lead.firstName || ''} ${lead.lastName || ''}`.trim()}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Add New Customer Form */}
            {isAddingNew && (
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">New Customer Information</h3>
                        <button
                            onClick={() => setIsAddingNew(false)}
                            className="text-gray-400 hover:text-gray-600"
                            aria-label="Close new customer form"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                                    First Name
                                </label>
                                <input
                                    id="firstName"
                                    type="text"
                                    value={formData.firstName || ''}
                                    onChange={(e) => handleFieldChange('firstName', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="John"
                                />
                            </div>
                            <div>
                                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                                    Last Name
                                </label>
                                <input
                                    id="lastName"
                                    type="text"
                                    value={formData.lastName || ''}
                                    onChange={(e) => handleFieldChange('lastName', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Doe"
                                />
                            </div>
                            <div>
                                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone Number
                                </label>
                                <input
                                    id="phoneNumber"
                                    type="tel"
                                    value={formData.phoneNumber || ''}
                                    onChange={(e) => handleFieldChange('phoneNumber', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="(555) 123-4567"
                                />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={formData.email || ''}
                                    onChange={(e) => handleFieldChange('email', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="john@example.com"
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                                Address
                            </label>
                            <input
                                id="address"
                                type="text"
                                value={formData.address || ''}
                                onChange={(e) => handleFieldChange('address', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="123 Main St, City, State 12345"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Job Count Form */}
            {(selectedCustomerId || isAddingNew) && (
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                            <Calculator className="w-6 h-6 mr-2 text-blue-600" />
                            {isAddingNew ? 'New Job Count' : `Job Count - ${selectedCustomer?.customerName || 'Customer'}`}
                        </h3>
                        {hasUnsavedChanges && (
                            <span className="text-sm text-orange-600 font-medium">Unsaved changes</span>
                        )}
                    </div>

                    <div className="space-y-6">
                        {/* Core Measurements */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 pb-2 border-b">
                                Core Measurements
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <FormField label="Square Feet" field="sqft" helpText="required" />
                                <FormField label="Ridge LF" field="ridgeLf" />
                                <FormField label="Valley LF" field="valleyLf" />
                                <FormField label="Eaves LF" field="eavesLf" />
                            </div>
                        </div>

                        {/* Ventilation */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 pb-2 border-b">
                                Ventilation
                            </h4>

                            {/* Ventilation Calculator */}
                            <div className="mb-4">
                                <VentilationCalculator
                                    sqft={formData.sqft}
                                    currentValues={{
                                        ridgeVents: formData.ridgeVents,
                                        turbineVents: formData.turbineVents,
                                        rimeFlow: formData.rimeFlow
                                    }}
                                    onCalculate={(values) => {
                                        setFormData(prev => ({
                                            ...prev,
                                            ridgeVents: values.ridgeVents,
                                            turbineVents: values.turbineVents,
                                            rimeFlow: values.rimeFlow
                                        }));
                                        setHasUnsavedChanges(true);
                                    }}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField label="Ridge Vents" field="ridgeVents" step="1" placeholder="Auto-calculated or manual" />
                                <FormField label="Turbine Vents" field="turbineVents" step="1" placeholder="Auto-calculated or manual" />
                                <FormField label="Rime Flow" field="rimeFlow" placeholder="Auto-calculated or manual" />
                            </div>
                        </div>

                        {/* Pipes */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 pb-2 border-b">
                                Pipes
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField label='Pipes 1"-2"' field="pipes12" step="1" />
                                <FormField label='Pipes 3"-4"' field="pipes34" step="1" />
                            </div>
                        </div>

                        {/* Roof Features */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 pb-2 border-b">
                                Roof Features
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <FormField label="Gables" field="gables" step="1" />
                                <FormField label="Turtle Backs" field="turtleBacks" step="1" />
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <CheckboxField label="Satellite" field="satellite" />
                                <CheckboxField label="Chimney" field="chimney" />
                                <CheckboxField label="Solar" field="solar" />
                                <CheckboxField label="Swamp Cooler" field="swampCooler" />
                            </div>
                        </div>

                        {/* Gutters */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 pb-2 border-b">
                                Gutters & Drainage
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField label="Gutter LF" field="gutterLf" />
                                <FormField label="Downspouts" field="downspouts" step="1" />
                                <FormField label="Gutter Guard LF" field="gutterGuardLf" />
                            </div>
                        </div>

                        {/* Additional */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 pb-2 border-b">
                                Additional Information
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField label="Permanent Lighting" field="permanentLighting" type="text" />
                                <FormField label="Quote Amount ($)" field="quoteAmount" />
                            </div>
                            <div className="mt-4">
                                <label htmlFor="quoteNotes" className="block text-sm font-medium text-gray-700 mb-1">
                                    Quote Notes
                                </label>
                                <textarea
                                    id="quoteNotes"
                                    name="quoteNotes"
                                    value={formData.quoteNotes || ''}
                                    onChange={(e) => handleFieldChange('quoteNotes', e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Additional notes about the quote..."
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-3 pt-4 border-t">
                            <button
                                onClick={handleCancel}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {isAddingNew ? 'Create Lead & Save Count' : 'Save Job Count'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!selectedCustomerId && !isAddingNew && (
                <div className="bg-white p-12 rounded-lg shadow-sm border text-center">
                    <Calculator className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Customer Selected</h3>
                    <p className="text-gray-600 mb-6">
                        Select a customer from the dropdown above to view or edit their job count information,<br />
                        or click "Add New Count" to create a new lead with job count data.
                    </p>
                </div>
            )}
        </div>
    );
}

export default JobCountView;
