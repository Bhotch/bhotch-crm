import React from 'react';
import { User, X, Edit2, Trash2, Phone, Mail, DollarSign, Tag, ClipboardList, Briefcase, Calendar, MapPin } from 'lucide-react';

const DetailItem = React.memo(({ icon, label, value }) => (
    <div>
        <dt className="text-sm font-medium text-gray-500 flex items-center">{icon}{label}</dt>
        <dd className="mt-1 text-sm text-gray-900">{value || <span className="text-gray-400">Not provided</span>}</dd>
    </div>
));

function LeadDetailModal({ lead, onEdit, onDelete, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-40 animate-fade-in">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-semibold text-gray-900 flex items-center"><User className="mr-3 text-blue-600" />{lead.customerName}</h3>
                    <p className="text-sm text-gray-500">{lead.address}</p>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            <div className="p-6 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 pb-6 border-b">
                    <DetailItem icon={<Phone size={14} className="mr-2" />} label="Phone" value={<a href={`tel:${lead.phoneNumber}`} className="text-blue-600 hover:underline">{lead.phoneNumber}</a>} />
                    <DetailItem icon={<Mail size={14} className="mr-2" />} label="Email" value={<a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">{lead.email}</a>} />
                    <DetailItem icon={<DollarSign size={14} className="mr-2" />} label="Quote" value={<span className="font-bold text-green-700">{lead.dabellaQuote}</span>} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 pb-6 border-b">
                    <DetailItem icon={<Tag size={14} className="mr-2" />} label="Quality" value={<span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${lead.quality === 'Hot' ? 'bg-red-100 text-red-800' : lead.quality === 'Warm' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{lead.quality}</span>} />
                    <DetailItem icon={<ClipboardList size={14} className="mr-2" />} label="Disposition" value={lead.disposition} />
                    <DetailItem icon={<Briefcase size={14} className="mr-2" />} label="Lead Source" value={lead.leadSource} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 pb-6 border-b">
                    <div className="bg-gray-50 p-4 rounded-lg text-center"><Calendar size={24} className="mx-auto text-gray-400 mb-2"/><h4 className="font-semibold text-sm">Appointments</h4><p className="text-xs text-gray-500">Click calendar tab</p></div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center"><Mail size={24} className="mx-auto text-gray-400 mb-2"/><h4 className="font-semibold text-sm">Communications</h4><p className="text-xs text-gray-500">Coming soon</p></div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center"><MapPin size={24} className="mx-auto text-gray-400 mb-2"/><h4 className="font-semibold text-sm">Location</h4><p className="text-xs text-gray-500">View on map tab</p></div>
                </div>
                <div>
                    <h4 className="text-md font-semibold text-gray-800 mb-2">Notes</h4>
                    <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-md whitespace-pre-wrap">{lead.notes || "No notes for this lead."}</p>
                </div>
            </div>
            <div className="flex justify-end space-x-3 p-4 bg-gray-50 border-t">
                <button onClick={onDelete} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"><Trash2 size={16} className="mr-2"/>Delete</button>
                <button onClick={onEdit} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"><Edit2 size={16} className="mr-2"/>Edit Lead</button>
            </div>
        </div>
    </div>
  );
}

export default LeadDetailModal;