import React, { useState, useCallback, useMemo } from 'react';
import { X, Loader2 } from 'lucide-react';
import { googleSheetsService } from '../../api/googleSheetsService';

// Reusable Form Components
const FormSection = ({ title, children }) => <div className="mb-6"><h4 className="text-md font-semibold text-gray-800 border-b pb-2 mb-4">{title}</h4><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div></div>;
const FormField = ({ label, children, fullWidth = false, htmlFor }) => <div className={fullWidth ? 'lg:col-span-3 md:col-span-2' : ''}><label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>{children}</div>;
const TextInput = (props) => <input {...props} id={props.name} autoComplete={props.autoComplete || 'off'} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500" />;
const SelectInput = ({ children, ...props }) => <select {...props} id={props.name} autoComplete={props.autoComplete || 'off'} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500">{children}</select>;
const TextareaInput = (props) => <textarea {...props} id={props.name} autoComplete={props.autoComplete || 'off'} rows={4} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500" />;

const initialFormData = { customerName: '', address: '', phoneNumber: '', email: '', dabellaQuote: '', quality: 'Cold', notes: '', disposition: 'New', leadSource: 'Door Knock', roofAge: '', roofType: 'Asphalt Shingle' };

function LeadFormModal({ initialData, onSubmit, onCancel, isEdit = false }) {
    const [formData, setFormData] = useState(() => initialData || initialFormData);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = useCallback((e) => setFormData(f => ({ ...f, [e.target.name]: e.target.value })), []);
    
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const dataToSubmit = { ...formData };
        if (dataToSubmit.address && (!dataToSubmit.latitude || !dataToSubmit.longitude)) {
            try {
                const geocodeResult = await googleSheetsService.geocodeAddress(dataToSubmit.address);
                if (geocodeResult.success) {
                    dataToSubmit.latitude = geocodeResult.latitude;
                    dataToSubmit.longitude = geocodeResult.longitude;
                }
            } catch (error) { console.warn('Geocoding failed during submission:', error); }
        }
        await onSubmit(dataToSubmit);
        setIsSubmitting(false);
    }, [formData, onSubmit]);

    const dispositionOptions = useMemo(() => ['New', 'Scheduled', 'Insurance', 'Quoted', 'Follow Up', 'Closed Sold', 'Closed Lost'], []);
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-40">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
                <div className="p-6 border-b flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">{isEdit ? "Edit Lead" : "Add New Lead"}</h3>
                    <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
                </div>
                <div className="p-6 overflow-y-auto">
                    <form onSubmit={handleSubmit}>
                        <FormSection title="Customer Information">
                            <FormField label="Full Name *" htmlFor="customerName"><TextInput name="customerName" value={formData.customerName} onChange={handleChange} autoComplete="name" required /></FormField>
                            <FormField label="Phone Number *" htmlFor="phoneNumber"><TextInput name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} autoComplete="tel" required /></FormField>
                            <FormField label="Email" htmlFor="email"><TextInput name="email" type="email" value={formData.email} onChange={handleChange} autoComplete="email" /></FormField>
                            <FormField label="Address" htmlFor="address" fullWidth><TextInput name="address" value={formData.address} onChange={handleChange} autoComplete="street-address" placeholder="Full address for map location" /></FormField>
                        </FormSection>
                        <FormSection title="Lead Details">
                            <FormField label="Lead Source" htmlFor="leadSource"><SelectInput name="leadSource" value={formData.leadSource} onChange={handleChange}><option>Door Knock</option><option>Rime</option><option>Adverta</option><option>Referral</option><option>DaBella</option></SelectInput></FormField>
                            <FormField label="Quality" htmlFor="quality"><SelectInput name="quality" value={formData.quality} onChange={handleChange}><option>Hot</option><option>Warm</option><option>Cold</option></SelectInput></FormField>
                            <FormField label="Disposition" htmlFor="disposition"><SelectInput name="disposition" value={formData.disposition} onChange={handleChange}>{dispositionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}</SelectInput></FormField>
                        </FormSection>
                        <FormSection title="Job & Quote Details">
                            <FormField label="Roof Age" htmlFor="roofAge"><TextInput name="roofAge" value={formData.roofAge} onChange={handleChange} /></FormField>
                            <FormField label="Roof Type" htmlFor="roofType"><SelectInput name="roofType" value={formData.roofType} onChange={handleChange}><option>Asphalt Shingle</option><option>Metal</option><option>Tile</option><option>TPO</option><option>Wood</option></SelectInput></FormField>
                            <FormField label="Quote Amount" htmlFor="dabellaQuote"><TextInput name="dabellaQuote" value={formData.dabellaQuote} onChange={handleChange} placeholder="$15,000" /></FormField>
                        </FormSection>
                        <FormSection title="Notes">
                            <FormField label="Notes" htmlFor="notes" fullWidth><TextareaInput name="notes" value={formData.notes} onChange={handleChange} /></FormField>
                        </FormSection>
                        <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
                            <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center">
                                {isSubmitting ? <><Loader2 className="animate-spin h-4 w-4 mr-2" />Saving...</> : (isEdit ? "Update Lead" : "Add Lead")}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default LeadFormModal;