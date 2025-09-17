import React from 'react';
import { X, Edit2, Trash2, Calculator, User } from 'lucide-react';

function JobCountDetailModal({ jobCount, onClose, onEdit, onDelete }) {
    const formatNumber = (value) => {
        if (!value || value === '0' || value === '-') return '-';
        return typeof value === 'number' ? value.toString() : value;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    const DetailSection = ({ title, children, icon: Icon }) => (
        <div className="mb-6">
            <div className="flex items-center mb-4">
                <Icon className="w-5 h-5 text-blue-600 mr-2" />
                <h4 className="text-lg font-semibold text-gray-800">{title}</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {children}
            </div>
        </div>
    );

    const DetailField = ({ label, value, fullWidth = false }) => (
        <div className={`${fullWidth ? 'lg:col-span-3 md:col-span-2' : ''} bg-gray-50 p-3 rounded-md`}>
            <dt className="text-sm font-medium text-gray-600">{label}</dt>
            <dd className="mt-1 text-sm text-gray-900 font-semibold">{formatNumber(value)}</dd>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] flex flex-col">
                <div className="p-6 border-b flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">
                            Job Count Details
                        </h3>
                        <p className="text-gray-600 mt-1">
                            {`${jobCount.firstName || ''} ${jobCount.lastName || ''}`.trim() || 'Unknown'}
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => onEdit(jobCount)}
                            className="p-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-md"
                            title="Edit Job Count"
                        >
                            <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => onDelete(jobCount.id)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md"
                            title="Delete Job Count"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto">
                    {/* Customer Information */}
                    <DetailSection title="Customer Information" icon={User}>
                        <DetailField label="First Name" value={jobCount.firstName} />
                        <DetailField label="Last Name" value={jobCount.lastName} />
                        <DetailField label="Full Name" value={jobCount.customerName} />
                        <DetailField label="Phone Number" value={jobCount.phoneNumber} />
                        <DetailField label="Email" value={jobCount.email} />
                        <DetailField label="Address" value={jobCount.address} fullWidth />
                    </DetailSection>

                    {/* Job Information */}
                    <DetailSection title="Job Information" icon={Calculator}>
                        <DetailField label="Date" value={formatDate(jobCount.date)} />
                        <DetailField label="Lead Source" value={jobCount.leadSource} />
                        <DetailField label="Quality" value={jobCount.quality} />
                        <DetailField label="Disposition" value={jobCount.disposition} />
                        <DetailField label="Roof Age" value={jobCount.roofAge} />
                        <DetailField label="Roof Type" value={jobCount.roofType} />
                        <DetailField label="Quote Amount" value={jobCount.dabellaQuote} />
                    </DetailSection>

                    {/* Primary Measurements */}
                    <DetailSection title="Primary Measurements" icon={Calculator}>
                        <DetailField label="SQ FT" value={jobCount.sqFt} />
                        <DetailField label="Ridge LF" value={jobCount.ridgeLf} />
                        <DetailField label="Valley LF" value={jobCount.valleyLf} />
                        <DetailField label="Eaves LF" value={jobCount.eavesLf} />
                    </DetailSection>

                    {/* Ventilation & Flow */}
                    <DetailSection title="Ventilation & Flow" icon={Calculator}>
                        <DetailField label="Ridge Vents" value={jobCount.ridgeVents} />
                        <DetailField label="Turbine" value={jobCount.turbine} />
                        <DetailField label="Rime Flow" value={jobCount.rimeFlow} />
                    </DetailSection>

                    {/* Ridge & Valley Components */}
                    <DetailSection title="Ridge & Valley Components" icon={Calculator}>
                        <DetailField label="High Profile Ridge Cap" value={jobCount.highProfileRidgeCap} />
                        <DetailField label="Valley Metal" value={jobCount.valleyMetal} />
                    </DetailSection>

                    {/* Pipes */}
                    <DetailSection title="Pipes" icon={Calculator}>
                        <DetailField label="Pipes [1 1/2&quot;]" value={jobCount.pipes1Half} />
                        <DetailField label="Pipes [2&quot;]" value={jobCount.pipes2} />
                        <DetailField label="Pipes [3&quot;]" value={jobCount.pipes3} />
                        <DetailField label="Pipes [4&quot;]" value={jobCount.pipes4} />
                    </DetailSection>

                    {/* Roof Features */}
                    <DetailSection title="Roof Features" icon={Calculator}>
                        <DetailField label="Gables" value={jobCount.gables} />
                        <DetailField label="Turtle Backs" value={jobCount.turtleBacks} />
                        <DetailField label="Satellite" value={jobCount.satellite} />
                        <DetailField label="Chimney" value={jobCount.chimney} />
                        <DetailField label="Solar" value={jobCount.solar} />
                        <DetailField label="Swamp Cooler" value={jobCount.swampCooler} />
                    </DetailSection>

                    {/* Gutters & Additional */}
                    <DetailSection title="Gutters & Additional" icon={Calculator}>
                        <DetailField label="Gutters LF" value={jobCount.guttersLf} />
                        <DetailField label="Downspouts" value={jobCount.downspouts} />
                        <DetailField label="Gutter Guard LF" value={jobCount.gutterGuardLf} />
                        <DetailField label="Permanent Lighting" value={jobCount.permanentLighting} />
                    </DetailSection>

                    {/* Notes */}
                    {jobCount.notes && (
                        <DetailSection title="Notes" icon={Calculator}>
                            <DetailField label="Notes" value={jobCount.notes} fullWidth />
                        </DetailSection>
                    )}
                </div>
            </div>
        </div>
    );
}

export default JobCountDetailModal;