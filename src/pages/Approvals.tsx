import React, { useEffect, useState } from 'react';
import { getFlights, FlightOrder, saveFlight } from '../services/db';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { X, CheckCircle, AlertCircle, Eye } from 'lucide-react';

export default function Approvals() {
  const { user } = useAuth();
  const [flights, setFlights] = useState<FlightOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingFlight, setRejectingFlight] = useState<FlightOrder | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const loadData = () => {
    setLoading(true);
    getFlights().then(data => {
      // Only show Submitted orders for approval
      setFlights(data.filter(f => f.status === 'Submitted'));
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (flight: FlightOrder) => {
    await saveFlight({ ...flight, status: 'Approved', approvedBy: user?.uid });
    setFlights(flights.filter(f => f.id !== flight.id));
  };

  const handleReject = async () => {
    if (rejectingFlight && rejectionReason.trim()) {
      await saveFlight({ ...rejectingFlight, status: 'Rejected', rejectionReason: rejectionReason });
      setFlights(flights.filter(f => f.id !== rejectingFlight.id));
      setRejectingFlight(null);
      setRejectionReason('');
    }
  };

  if (user?.role === 'crew') {
    return <div className="p-4 sm:p-8 text-red-500">Access Denied. Approvers only.</div>;
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Pending Approvals</h1>
        <p className="text-slate-500 text-sm">Review and approve or reject {flights.length} pending orders</p>
      </div>
      
      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading...</div>
      ) : flights.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-dashed border-slate-300">
          <p className="text-slate-500">No orders pending approval.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {flights.map(flight => (
            <div key={flight.id} className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-medium text-slate-900 truncate">Flight {flight.flightNumber} ({flight.departure} → {flight.arrival})</h3>
                <div className="mt-1 space-y-0.5">
                  <p className="text-xs sm:text-sm text-slate-500">Date: {new Date(flight.date).toLocaleString()}</p>
                  <p className="text-xs sm:text-sm text-slate-500">Items: {flight.items.length} | Submitted by: {flight.createdBy}</p>
                </div>
              </div>
              <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto">
                <Link to={`/flights/${flight.id}`} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 text-xs sm:text-sm text-blue-600 hover:bg-blue-50 rounded-md border border-blue-100 font-medium">
                  <Eye className="w-4 h-4" /> View
                </Link>
                <button onClick={() => setRejectingFlight(flight)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 text-xs sm:text-sm border border-red-300 text-red-600 rounded-md hover:bg-red-50 font-medium">
                  <X className="w-4 h-4" /> Reject
                </button>
                <button onClick={() => handleApprove(flight)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 text-xs sm:text-sm bg-green-600 text-white rounded-md hover:bg-green-700 font-medium">
                  <CheckCircle className="w-4 h-4" /> Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingFlight && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="font-medium text-slate-900">Reject Order</h2>
              <button onClick={() => setRejectingFlight(null)} className="text-slate-400 hover:text-slate-600 p-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3 p-3 bg-red-50 rounded-md text-red-700 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>You are rejecting order for Flight {rejectingFlight.flightNumber}. Please provide a reason.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rejection Reason *</label>
                <textarea 
                  value={rejectionReason} 
                  onChange={e => setRejectionReason(e.target.value)} 
                  className="w-full border border-slate-300 rounded-md p-2 text-sm h-32 focus:ring-2 focus:ring-red-500 focus:border-red-500" 
                  placeholder="e.g., Incorrect item quantities, missing dietary requirements..."
                  autoFocus
                ></textarea>
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row justify-end gap-3 bg-slate-50">
              <button onClick={() => setRejectingFlight(null)} className="w-full sm:w-auto px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-md text-sm font-medium">Cancel</button>
              <button 
                onClick={handleReject} 
                disabled={!rejectionReason.trim()}
                className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
