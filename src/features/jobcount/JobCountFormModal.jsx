import React, { useState, useCallback } from 'react';
import { X, Loader2 } from 'lucide-react';

// Reusable Form Components
const FormSection = ({ title, children }) => (
    <div className="mb-6">
        <h4 className="text-md font-semibold text-gray-800 border-b pb-2 mb-4">{title}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {children}
        </div>
    </div>
);

const FormField = ({ label, children, fullWidth = false, required = false }) => (
    <div className={fullWidth ? 'lg:col-span-3 md:col-span-2' : ''}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {children}
    </div>
);

const NumberInput = (props) => (
    <input
        {...props}
        type="number"
        step="0.01"
        min="0"
        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
    />
);

const TextInput = (props) => (
    <input
        {...props}
        type="text"
        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
    />
);

const DateInput = (props) => (
    <input
        {...props}
        type="date"
        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
    />
);

const initialFormData = {
    firstName: '',
    lastName: '',
    date: new Date().toISOString().split('T')[0], // Today's date
    sqFt: '',
    ridgeLf: '',
    valleyLf: '',
    eavesLf: '',
    ridgeVents: '',
    turbine: '',
    rimeFlow: '',
    highProfileRidgeCap: '',
    valleyMetal: '',
    pipes1Half: '',
    pipes2: '',
    pipes3: '',
    pipes4: '',
    gables: '',
    turtleBacks: '',
    satellite: '',
    chimney: '',
    solar: '',
    swampCooler: '',
    guttersLf: '',
    downspouts: '',
    gutterGuardLf: '',
    permanentLighting: ''
};

function JobCountFormModal({ initialData, onSubmit, onCancel, isEdit = false }) {
    const [formData, setFormData] = useState(() => initialData || initialFormData);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = useCallback((e) => {
        setFormData(f => ({ ...f, [e.target.name]: e.target.value }));
    }, []);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Clean up the data before submitting
        const dataToSubmit = { ...formData };

        // Convert empty strings to null for numeric fields
        const numericFields = [
            'sqFt', 'ridgeLf', 'valleyLf', 'eavesLf', 'ridgeVents', 'turbine',
            'rimeFlow', 'highProfileRidgeCap', 'valleyMetal', 'pipes1Half',
            'pipes2', 'pipes3', 'pipes4', 'gables', 'turtleBacks', 'satellite',
            'chimney', 'solar', 'swampCooler', 'guttersLf', 'downspouts',
            'gutterGuardLf', 'permanentLighting'
        ];

        numericFields.forEach(field => {
            if (dataToSubmit[field] === '') {
                dataToSubmit[field] = null;
            }
        });

        await onSubmit(dataToSubmit);
        setIsSubmitting(false);
    }, [formData, onSubmit]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-40">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] flex flex-col">
                <div className="p-6 border-b flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">
                        {isEdit ? "Edit Job Count" : "Add New Job Count"}
                    </h3>
                    <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <form onSubmit={handleSubmit}>
                        {/* Basic Information */}
                        <FormSection title="Basic Information">
                            <FormField label="First Name" required>
                                <TextInput
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                />
                            </FormField>
                            <FormField label="Last Name">
                                <TextInput
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                />
                            </FormField>
                            <FormField label="Date" required>
                                <DateInput
                                    name="date"
                                    value={formData.date}
                                    onChange={handleChange}
                                    required
                                />
                            </FormField>
                        </FormSection>

                        {/* Primary Measurements */}
                        <FormSection title="Primary Measurements">
                            <FormField label="SQ FT" required>
                                <NumberInput
                                    name="sqFt"
                                    value={formData.sqFt}
                                    onChange={handleChange}
                                    required
                                />
                            </FormField>
                            <FormField label="Ridge LF" required>
                                <NumberInput
                                    name="ridgeLf"
                                    value={formData.ridgeLf}
                                    onChange={handleChange}
                                    required
                                />
                            </FormField>
                            <FormField label="Valley LF" required>
                                <NumberInput
                                    name="valleyLf"
                                    value={formData.valleyLf}
                                    onChange={handleChange}
                                    required
                                />
                            </FormField>
                            <FormField label="Eaves LF" required>
                                <NumberInput
                                    name="eavesLf"
                                    value={formData.eavesLf}
                                    onChange={handleChange}
                                    required
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
                                />
                            </FormField>
                            <FormField label="Turbine">
                                <NumberInput
                                    name="turbine"
                                    value={formData.turbine}
                                    onChange={handleChange}
                                />
                            </FormField>
                            <FormField label="Rime Flow">
                                <NumberInput
                                    name="rimeFlow"
                                    value={formData.rimeFlow}
                                    onChange={handleChange}
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
                                />
                            </FormField>
                            <FormField label="Valley Metal">
                                <NumberInput
                                    name="valleyMetal"
                                    value={formData.valleyMetal}
                                    onChange={handleChange}
                                />
                            </FormField>
                        </FormSection>

                        {/* Pipes */}
                        <FormSection title="Pipes">
                            <FormField label="Pipes [1 1/2&quot;]">
                                <NumberInput
                                    name="pipes1Half"
                                    value={formData.pipes1Half}
                                    onChange={handleChange}
                                />
                            </FormField>
                            <FormField label="Pipes [2&quot;]">
                                <NumberInput
                                    name="pipes2"
                                    value={formData.pipes2}
                                    onChange={handleChange}
                                />
                            </FormField>
                            <FormField label="Pipes [3&quot;]">
                                <NumberInput
                                    name="pipes3"
                                    value={formData.pipes3}
                                    onChange={handleChange}
                                />
                            </FormField>
                            <FormField label="Pipes [4&quot;]">
                                <NumberInput
                                    name="pipes4"
                                    value={formData.pipes4}
                                    onChange={handleChange}
                                />
                            </FormField>
                        </FormSection>

                        {/* Roof Features */}
                        <FormSection title="Roof Features">
                            <FormField label="Gables">
                                <NumberInput
                                    name="gables"
                                    value={formData.gables}
                                    onChange={handleChange}
                                />
                            </FormField>
                            <FormField label="Turtle Backs">
                                <NumberInput
                                    name="turtleBacks"
                                    value={formData.turtleBacks}
                                    onChange={handleChange}
                                />
                            </FormField>
                            <FormField label="Satellite">
                                <NumberInput
                                    name="satellite"
                                    value={formData.satellite}
                                    onChange={handleChange}
                                />
                            </FormField>
                            <FormField label="Chimney">
                                <NumberInput
                                    name="chimney"
                                    value={formData.chimney}
                                    onChange={handleChange}
                                />
                            </FormField>
                            <FormField label="Solar">
                                <NumberInput
                                    name="solar"
                                    value={formData.solar}
                                    onChange={handleChange}
                                />
                            </FormField>
                            <FormField label="Swamp Cooler">
                                <NumberInput
                                    name="swampCooler"
                                    value={formData.swampCooler}
                                    onChange={handleChange}
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
                                />
                            </FormField>
                            <FormField label="Downspouts">
                                <NumberInput
                                    name="downspouts"
                                    value={formData.downspouts}
                                    onChange={handleChange}
                                />
                            </FormField>
                            <FormField label="Gutter Guard LF">
                                <NumberInput
                                    name="gutterGuardLf"
                                    value={formData.gutterGuardLf}
                                    onChange={handleChange}
                                />
                            </FormField>
                            <FormField label="Permanent Lighting">
                                <NumberInput
                                    name="permanentLighting"
                                    value={formData.permanentLighting}
                                    onChange={handleChange}
                                />
                            </FormField>
                        </FormSection>

                        <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
                            <button
                                type="button"
                                onClick={onCancel}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
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