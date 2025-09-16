// src/App.jsx

import { useState } from 'react';
import { Plus, RefreshCw, AlertCircle } from 'lucide-react';

// Import our structured code
import { useLeads } from './hooks/useLeads';
import { Dashboard } from './features/Dashboard/Dashboard';
import { Modal } from './components/Modal';
import { LeadForm } from './components/LeadForm';

// Simple components that can live here or be moved to /components
const LoadingSpinner = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

const ErrorState = ({ error, onRetry }) => (
  <div className="flex h-screen items-center justify-center bg-gray-50 p-4">
    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg text-center">
      <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
      <h3 className="mt-4 text-lg font-semibold text-gray-900">Application Error</h3>
      <p className="mt-2 text-sm text-gray-600">{error}</p>
      <button onClick={onRetry} className="mt-6 w-full inline-flex justify-center items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
        <RefreshCw className="w-4 h-4 mr-2" /> Try Again
      </button>
    </div>
  </div>
);

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { leads, isLoading, error, refetch, addLead } = useLeads();

  const handleAddLead = async (leadData) => {
    try {
      const response = await addLead(leadData);
      if (response.success) {
        setIsModalOpen(false); // Close modal on success!
        // You could add a success notification here
      } else {
        throw new Error(response.message || 'An unknown error occurred.');
      }
    } catch (err) {
      alert(`Error: ${err.message}`); // Simple error feedback
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Modal title="Add New Lead" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <LeadForm onSubmit={handleAddLead} onCancel={() => setIsModalOpen(false)} />
      </Modal>

      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Bhotch CRM</h1>
            <div className="flex items-center space-x-4">
              <button onClick={refetch} className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm text-gray-600 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                <RefreshCw className="w-4 h-4 mr-2" /> Refresh
              </button>
              <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" /> Add Lead
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        <Dashboard leads={leads} />
      </main>
    </div>
  );
}

export default App;