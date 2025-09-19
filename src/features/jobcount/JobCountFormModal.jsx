import React, { useState, useCallback } from 'react';
import { X, Loader2 } from 'lucide-react';

// Form Components
const FormSection = ({ title, children }) => (
    <div className="mb-8">
        <h4 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-3 mb-6">{title}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {children}
        </div>
    </div>
);

const FormField = ({ label, children, fullWidth = false, required = false }) => (
    <div className={fullWidth ? 'lg:col-span-3 md:col-span-2' : ''}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {children}
    </div>
);

const TextInput = (props) => (
    <input
        {...props}
        type="text"
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
    />
);

const NumberInput = (props) => (
    <input
        {...props}
        type="number"
        step="0.01"
        min="0"
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
    />
);


const SelectInput = ({ children, ...props }) => (
    <select
        {...props}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
    >
        {children}
    </select>
);

const TextareaInput = (props) => (
    <textarea
        {...props}
        rows={4}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical"
    />
);

const initialFormData = {
    // Customer Information
    firstName: '',
    lastName: '',
    customerName: '',
    phoneNumber: '',
    email: '',
    address: '',

    // Job Information
    date: new Date().toISOString().split('T')[0],
    notes: '',

    // Primary Measurements
    sqFt: '',
    ridgeLf: '',
    valleyLf: '',
    eavesLf: '',

    // Ventilation & Flow
    ridgeVents: '',
    turbine: '',
    rimeFlow: '',

    // Ridge & Valley Components
    highProfileRidgeCap: '',
    valleyMetal: '',

    // Pipes
    pipes1Half2: '',
    pipes3To5: '',

    // Gutters & Additional
    guttersLf: '',
    downspouts: '',
    gutterGuardLf: '',
    permanentLighting: ''
};

function JobCountFormModal({ initialData, onSubmit, onCancel, isEdit = false, leads = [] }) {
    const [formData, setFormData] = useState(() => initialData || initialFormData);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [showNewCustomerFields, setShowNewCustomerFields] = useState(false);

    const calculateVentilationValues = useCallback((sqFt) => {
        const sqFtNumber = parseFloat(sqFt);
        if (isNaN(sqFtNumber) || sqFtNumber <= 0) return {};

        return {
            ridgeVents: Math.ceil(sqFtNumber / 250).toString(),
            turbine: Math.ceil(sqFtNumber / 1250).toString(),
            rimeFlow: Math.ceil(sqFtNumber * 0.04).toString()
        };
    }, []);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };

            if (name === 'sqFt' && value) {
                const ventilationValues = calculateVentilationValues(value);
                Object.assign(newData, ventilationValues);
            }

            return newData;
        });
    }, [calculateVentilationValues]);

    const handleCustomerSelect = useCallback((e) => {
        const customerId = e.target.value;
        setSelectedCustomerId(customerId);

        if (!customerId) {
            setShowNewCustomerFields(true);
            setFormData(prev => ({
                ...prev,
                firstName: '',
                lastName: '',
                customerName: '',
                phoneNumber: '',
                email: '',
                address: ''
            }));
        } else {
            setShowNewCustomerFields(false);
            const selectedLead = leads.find(lead => lead.id === customerId);
            if (selectedLead) {
                setFormData(prev => ({
                    ...prev,
                    firstName: selectedLead.firstName || '',
                    lastName: selectedLead.lastName || '',
                    customerName: selectedLead.customerName || '',
                    phoneNumber: selectedLead.phoneNumber || '',
                    email: selectedLead.email || '',
                    address: selectedLead.address || ''
                }));
            }
        }
    }, [leads]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Clean up the data before submitting
            const dataToSubmit = { ...formData };

            // Ensure customer name is set from individual names if not provided
            if (!dataToSubmit.customerName && (dataToSubmit.firstName || dataToSubmit.lastName)) {
                dataToSubmit.customerName = `${dataToSubmit.firstName || ''} ${dataToSubmit.lastName || ''}`.trim();
            }

            await onSubmit(dataToSubmit);
        } catch (error) {
            console.error('Form submission error:', error);
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, onSubmit]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-7xl w-full max-h-[95vh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900">
                            {isEdit ? "Edit Job Count" : "Add New Job Count"}
                        </h3>
                        <p className="text-gray-600 mt-1">
                            {isEdit ? "Update job count information" : "Enter customer and job measurement details"}
                        </p>
                    </div>
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Form Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Customer Information */}
                        <FormSection title="Customer Information">
                            <FormField label="Select Customer" fullWidth required>
                                <SelectInput value={selectedCustomerId} onChange={handleCustomerSelect}>
                                    <option value="">Add New Customer...</option>
                                    {leads.map(lead => (
                                        <option key={lead.id} value={lead.id}>
                                            {lead.customerName || `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Unnamed Customer'}
                                        </option>
                                    ))}
                                </SelectInput>
                            </FormField>

                            <FormField label="Date" required>
                                <input
                                    type="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                />
                            </FormField>

                            {(showNewCustomerFields || isEdit) && (
                                <>
                                    <FormField label="First Name" required>
                                        <TextInput
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            required
                                            placeholder="John"
                                        />
                                    </FormField>
                                    <FormField label="Last Name">
                                        <TextInput
                                            name="lastName"
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            placeholder="Doe"
                                        />
                                    </FormField>
                                    <FormField label="Full Name">
                                        <TextInput
                                            name="customerName"
                                            value={formData.customerName}
                                            onChange={handleChange}
                                            placeholder="John Doe"
                                        />
                                    </FormField>
                                    <FormField label="Phone Number">
                                        <TextInput
                                            name="phoneNumber"
                                            value={formData.phoneNumber}
                                            onChange={handleChange}
                                            placeholder="(555) 123-4567"
                                        />
                                    </FormField>
                                    <FormField label="Email">
                                        <TextInput
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="john@example.com"
                                        />
                                    </FormField>
                                    <FormField label="Address" fullWidth>
                                        <TextInput
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            placeholder="123 Main St, City, State 12345"
                                        />
                                    </FormField>
                                </>
                            )}
                        </FormSection>


                        {/* Primary Measurements */}
                        <FormSection title="Primary Measurements">
                            <FormField label="SQ FT" required>
                                <NumberInput
                                    name="sqFt"
                                    value={formData.sqFt}
                                    onChange={handleChange}
                                    required
                                    placeholder="2500"
                                />
                            </FormField>
                            <FormField label="Ridge LF" required>
                                <NumberInput
                                    name="ridgeLf"
                                    value={formData.ridgeLf}
                                    onChange={handleChange}
                                    required
                                    placeholder="150"
                                />
                            </FormField>
                            <FormField label="Valley LF" required>
                                <NumberInput
                                    name="valleyLf"
                                    value={formData.valleyLf}
                                    onChange={handleChange}
                                    required
                                    placeholder="75"
                                />
                            </FormField>
                            <FormField label="Eaves LF" required>
                                <NumberInput
                                    name="eavesLf"
                                    value={formData.eavesLf}
                                    onChange={handleChange}
                                    required
                                    placeholder="200"
                                />
                            </FormField>
                        </FormSection>

                        {/* Ventilation & Flow */}
                        <FormSection title="Ventilation & Flow">
                            <FormField label="Ridge Vents">
                                <NumberInput
                                    name="ridgeVents"
                                    value={formData.ridgeVents}
                                    onChange={handleChange}
                                    placeholder="10"
                                />
                            </FormField>
                            <FormField label="Turbine">
                                <NumberInput
                                    name="turbine"
                                    value={formData.turbine}
                                    onChange={handleChange}
                                    placeholder="2"
                                />
                            </FormField>
                            <FormField label="Rime Flow">
                                <NumberInput
                                    name="rimeFlow"
                                    value={formData.rimeFlow}
                                    onChange={handleChange}
                                    placeholder="100"
                                />
                            </FormField>
                        </FormSection>

                        {/* Ridge & Valley Components */}
                        <FormSection title="Ridge & Valley Components">
                            <FormField label="High Profile Ridge Cap">
                                <NumberInput
                                    name="highProfileRidgeCap"
                                    value={formData.highProfileRidgeCap}
                                    onChange={handleChange}
                                    placeholder="20"
                                />
                            </FormField>
                            <FormField label="Valley Metal">
                                <NumberInput
                                    name="valleyMetal"
                                    value={formData.valleyMetal}
                                    onChange={handleChange}
                                    placeholder="15"
                                />
                            </FormField>
                        </FormSection>

                        {/* Pipes */}
                        <FormSection title="Pipes">
                            <FormField label="Pipes 1 1/2&quot; - 2&quot;">
                                <NumberInput
                                    name="pipes1Half2"
                                    value={formData.pipes1Half2 || formData.pipes1Half}
                                    onChange={handleChange}
                                    placeholder="5"
                                />
                            </FormField>
                            <FormField label="Pipes 3&quot; - 5&quot;">
                                <NumberInput
                                    name="pipes3To5"
                                    value={formData.pipes3To5 || formData.pipes3}
                                    onChange={handleChange}
                                    placeholder="2"
                                />
                            </FormField>
                        </FormSection>


                        {/* Gutters & Additional */}
                        <FormSection title="Gutters & Additional">
                            <FormField label="Gutters LF">
                                <NumberInput
                                    name="guttersLf"
                                    value={formData.guttersLf}
                                    onChange={handleChange}
                                    placeholder="180"
                                />
                            </FormField>
                            <FormField label="Downspouts">
                                <NumberInput
                                    name="downspouts"
                                    value={formData.downspouts}
                                    onChange={handleChange}
                                    placeholder="6"
                                />
                            </FormField>
                            <FormField label="Gutter Guard LF">
                                <NumberInput
                                    name="gutterGuardLf"
                                    value={formData.gutterGuardLf}
                                    onChange={handleChange}
                                    placeholder="180"
                                />
                            </FormField>
                            <FormField label="Permanent Lighting">
                                <NumberInput
                                    name="permanentLighting"
                                    value={formData.permanentLighting}
                                    onChange={handleChange}
                                    placeholder="200"
                                />
                            </FormField>
                        </FormSection>

                        {/* Notes */}
                        <FormSection title="Notes">
                            <FormField label="Additional Notes" fullWidth>
                                <TextareaInput
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    placeholder="Any additional notes about this job count..."
                                />
                            </FormField>
                        </FormSection>

                        {/* Footer */}
                        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={onCancel}
                                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="animate-spin h-5 w-5 mr-2" />
                                        Saving...
                                    </>
                                ) : (
                                    isEdit ? "Update Job Count" : "Add Job Count"
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default JobCountFormModal;