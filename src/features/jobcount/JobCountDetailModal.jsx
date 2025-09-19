import React, { useCallback } from 'react';
import { X, Edit2, Trash2, Calculator, User, FileText } from 'lucide-react';
import VentCalculationWidget from '../../components/VentCalculationWidget';
import { useNotifications } from '../../hooks/useNotifications';
import { googleSheetsService } from '../../api/googleSheetsService';

function JobCountDetailModal({ jobCount, onClose, onEdit, onDelete, onJobCountUpdate }) {
    const { addNotification } = useNotifications();
    const formatNumber = (value) => {
        if (!value || value === '0' || value === '-') return '-';
        return Number(value).toLocaleString();
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

    const formatPhone = (phone) => {
        if (!phone) return '-';
        const cleaned = phone.toString().replace(/\D/g, '');
        if (cleaned.length === 10) {
            return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
        }
        return phone;
    };

    const formatCurrency = (amount) => {
        if (!amount || amount === '0' || amount === '-') return '-';
        return `$${formatNumber(amount)}`;
    };

    const DetailSection = ({ title, children, icon: Icon }) => (
        <div className="mb-8">
            <div className="flex items-center mb-6">
                <Icon className="w-6 h-6 text-blue-600 mr-3" />
                <h4 className="text-xl font-semibold text-gray-800">{title}</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {children}
            </div>
        </div>
    );

    const DetailField = ({ label, value, fullWidth = false }) => (
        <div className={`${fullWidth ? 'lg:col-span-3 md:col-span-2' : ''} bg-gray-50 p-4 rounded-lg border`}>
            <dt className="text-sm font-medium text-gray-600 mb-1">{label}</dt>
            <dd className="text-base text-gray-900 font-semibold">{value || '-'}</dd>
        </div>
    );

    const customerName = jobCount.customerName || `${jobCount.firstName || ''} ${jobCount.lastName || ''}`.trim() || 'Unknown Customer';

    const handleCalculationComplete = useCallback(async (updatedJobCount) => {
        try {
            const response = await googleSheetsService.updateJobCount(updatedJobCount);
            if (response.success) {
                if (onJobCountUpdate) {
                    onJobCountUpdate(updatedJobCount);
                }
                addNotification('Job count updated with vent calculations', 'success');
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            addNotification(`Failed to update job count: ${error.message}`, 'error');
        }
    }, [onJobCountUpdate, addNotification]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-7xl w-full max-h-[95vh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900">Job Count Details</h3>
                        <p className="text-gray-600 mt-1">{customerName}</p>
                        <p className="text-sm text-gray-500 mt-1">Date: {formatDate(jobCount.date)}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => onEdit(jobCount)}
                            className="p-3 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Edit Job Count"
                        >
                            <Edit2 className="w-6 h-6" />
                        </button>
                        <button
                            onClick={() => onDelete(jobCount.id)}
                            className="p-3 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Job Count"
                        >
                            <Trash2 className="w-6 h-6" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {/* Lomanco Vent Calculator Widget */}
                    <div className="mb-8">
                        <VentCalculationWidget
                            jobCount={jobCount}
                            onCalculationComplete={handleCalculationComplete}
                            addNotification={addNotification}
                        />
                    </div>

                    {/* Customer Information */}
                    <DetailSection title="Customer Information" icon={User}>
                        <DetailField label="First Name" value={jobCount.firstName} />
                        <DetailField label="Last Name" value={jobCount.lastName} />
                        <DetailField label="Full Name" value={jobCount.customerName} />
                        <DetailField label="Phone Number" value={formatPhone(jobCount.phoneNumber)} />
                        <DetailField label="Email" value={jobCount.email} />
                        <DetailField label="Address" value={jobCount.address} fullWidth />
                    </DetailSection>

                    {/* Job Information */}
                    <DetailSection title="Job Information" icon={FileText}>
                        <DetailField label="Date" value={formatDate(jobCount.date)} />
                        <DetailField label="Lead Source" value={jobCount.leadSource} />
                        <DetailField label="Quality" value={jobCount.quality} />
                        <DetailField label="Disposition" value={jobCount.disposition} />
                        <DetailField label="Roof Age" value={jobCount.roofAge} />
                        <DetailField label="Roof Type" value={jobCount.roofType} />
                        <DetailField label="Quote Amount" value={formatCurrency(jobCount.dabellaQuote)} />
                    </DetailSection>

                    {/* Primary Measurements */}
                    <DetailSection title="Primary Measurements" icon={Calculator}>
                        <DetailField label="SQ FT" value={formatNumber(jobCount.sqFt)} />
                        <DetailField label="Ridge LF" value={formatNumber(jobCount.ridgeLf)} />
                        <DetailField label="Valley LF" value={formatNumber(jobCount.valleyLf)} />
                        <DetailField label="Eaves LF" value={formatNumber(jobCount.eavesLf)} />
                    </DetailSection>

                    {/* Ventilation & Flow */}
                    <DetailSection title="Ventilation & Flow" icon={Calculator}>
                        <DetailField label="Ridge Vents" value={formatNumber(jobCount.ridgeVents)} />
                        <DetailField label="Turbine" value={formatNumber(jobCount.turbine)} />
                        <DetailField label="Rime Flow" value={formatNumber(jobCount.rimeFlow)} />
                    </DetailSection>

                    {/* Ridge & Valley Components */}
                    <DetailSection title="Ridge & Valley Components" icon={Calculator}>
                        <DetailField label="High Profile Ridge Cap" value={formatNumber(jobCount.highProfileRidgeCap)} />
                        <DetailField label="Valley Metal" value={formatNumber(jobCount.valleyMetal)} />
                    </DetailSection>

                    {/* Pipes */}
                    <DetailSection title="Pipes" icon={Calculator}>
                        <DetailField label="Pipes [1 1/2&quot;]" value={formatNumber(jobCount.pipes1Half)} />
                        <DetailField label="Pipes [2&quot;]" value={formatNumber(jobCount.pipes2)} />
                        <DetailField label="Pipes [3&quot;]" value={formatNumber(jobCount.pipes3)} />
                        <DetailField label="Pipes [4&quot;]" value={formatNumber(jobCount.pipes4)} />
                    </DetailSection>

                    {/* Roof Features */}
                    <DetailSection title="Roof Features" icon={Calculator}>
                        <DetailField label="Gables" value={formatNumber(jobCount.gables)} />
                        <DetailField label="Turtle Backs" value={formatNumber(jobCount.turtleBacks)} />
                        <DetailField label="Satellite" value={formatNumber(jobCount.satellite)} />
                        <DetailField label="Chimney" value={formatNumber(jobCount.chimney)} />
                        <DetailField label="Solar" value={formatNumber(jobCount.solar)} />
                        <DetailField label="Swamp Cooler" value={formatNumber(jobCount.swampCooler)} />
                    </DetailSection>

                    {/* Gutters & Additional */}
                    <DetailSection title="Gutters & Additional" icon={Calculator}>
                        <DetailField label="Gutters LF" value={formatNumber(jobCount.guttersLf)} />
                        <DetailField label="Downspouts" value={formatNumber(jobCount.downspouts)} />
                        <DetailField label="Gutter Guard LF" value={formatNumber(jobCount.gutterGuardLf)} />
                        <DetailField label="Permanent Lighting" value={formatNumber(jobCount.permanentLighting)} />
                    </DetailSection>

                    {/* Notes */}
                    {jobCount.notes && (
                        <DetailSection title="Notes" icon={FileText}>
                            <DetailField label="Additional Notes" value={jobCount.notes} fullWidth />
                        </DetailSection>
                    )}

                    {/* Summary Totals */}
                    <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
                        <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                            <Calculator className="w-5 h-5 mr-2" />
                            Summary Totals
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-900">{formatNumber(jobCount.sqFt)}</div>
                                <div className="text-sm text-blue-700">Total SQ FT</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-900">{formatNumber(jobCount.ridgeLf)}</div>
                                <div className="text-sm text-blue-700">Ridge LF</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-900">{formatNumber(jobCount.valleyLf)}</div>
                                <div className="text-sm text-blue-700">Valley LF</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-900">{formatCurrency(jobCount.dabellaQuote)}</div>
                                <div className="text-sm text-blue-700">Quote Value</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default JobCountDetailModal;