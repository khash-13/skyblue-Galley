import React, { useEffect, useState } from 'react';
import { getFlights, FlightOrder, saveFlight } from '../services/db';
import { Upload, Eye, FileText, CheckCircle, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function OrderTracking() {
  const [flights, setFlights] = useState<FlightOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<FlightOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [billAmount, setBillAmount] = useState('');
  const [billNotes, setBillNotes] = useState('');

  const loadData = () => {
    setLoading(true);
    getFlights().then(data => {
      // Show orders that are not drafts
      setFlights(data.filter(f => f.status !== 'Draft'));
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUploadBill = async () => {
    if (!selectedOrder) return;
    await saveFlight({
      ...selectedOrder,
      billAmount: parseFloat(billAmount),
      billNotes,
      status: 'Completed' // Auto complete when bill is uploaded for this MVP
    });
    setIsModalOpen(false);
    setSelectedOrder(null);
    setBillAmount('');
    setBillNotes('');
    loadData();
  };

  const openUploadModal = (order: FlightOrder) => {
    setSelectedOrder(order);
    setBillAmount(order.billAmount?.toString() || '');
    setBillNotes(order.billNotes || '');
    setIsModalOpen(true);
  };

  const statuses = ['Draft', 'Submitted', 'Approved', 'Sent to Vendor', 'Confirmed', 'Completed'];

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Order Tracking</h1>
        <p className="text-slate-500 text-sm">Track delivery status and upload vendor bills for {flights.length} orders</p>
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="text-center text-slate-500">Loading...</div>
        ) : flights.map(order => {
          const currentStatusIndex = statuses.indexOf(order.status);
          
          return (
            <div key={order.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-1">
                    <h3 className="font-medium text-slate-900 text-sm sm:text-base truncate">Order #{order.id?.slice(0,6)} — {order.departure} → {order.arrival}</h3>
                    <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-[10px] font-medium">{order.status}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500">
                    {new Date(order.date).toLocaleDateString()} • {order.items.length} items
                  </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button onClick={() => openUploadModal(order)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-md hover:bg-slate-50 text-slate-700">
                    <Upload className="w-4 h-4" /> Upload Bill
                  </button>
                  <Link to={`/flights/${order.id}`} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-md hover:bg-slate-50 text-slate-700">
                    <Eye className="w-4 h-4" /> View
                  </Link>
                </div>
              </div>

              {/* Status Stepper - Responsive */}
              <div className="relative">
                {/* Desktop Horizontal Stepper */}
                <div className="hidden sm:flex items-center justify-between relative">
                  <div className="absolute left-0 top-1/2 w-full h-0.5 bg-slate-100 -z-10 transform -translate-y-1/2"></div>
                  {statuses.map((status, idx) => {
                    const isCompleted = idx <= currentStatusIndex;
                    const isCurrent = idx === currentStatusIndex;
                    return (
                      <div key={status} className="flex flex-col items-center gap-2 bg-white px-2">
                        <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-medium border ${
                          isCurrent ? 'bg-slate-900 text-white border-slate-900' :
                          isCompleted ? 'bg-slate-100 text-slate-700 border-slate-200' :
                          'bg-white text-slate-400 border-slate-200'
                        }`}>
                          {isCompleted && !isCurrent && <CheckCircle className="w-3 h-3" />}
                          {status}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Mobile Vertical Stepper */}
                <div className="sm:hidden space-y-3">
                  {statuses.map((status, idx) => {
                    const isCompleted = idx <= currentStatusIndex;
                    const isCurrent = idx === currentStatusIndex;
                    if (idx > currentStatusIndex + 1 && idx < statuses.length - 1) return null; // Show current, next, and last
                    
                    return (
                      <div key={status} className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-slate-900' : 'bg-slate-200'}`}></div>
                        <div className={`text-xs font-medium ${isCurrent ? 'text-slate-900' : isCompleted ? 'text-slate-600' : 'text-slate-400'}`}>
                          {status}
                          {isCurrent && <span className="ml-2 text-[10px] text-slate-400 font-normal">(Current)</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                <div>
                  <p className="text-[10px] font-medium text-slate-900 mb-1">Order Submitted</p>
                  <p className="text-[10px] text-slate-500">{order.createdBy} - {new Date(order.createdAt || '').toLocaleString()}</p>
                </div>
                {order.approvedBy && (
                  <div>
                    <p className="text-[10px] font-medium text-slate-900 mb-1">Order Approved</p>
                    <p className="text-[10px] text-slate-500">{order.approvedBy} - {new Date(order.updatedAt || '').toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="font-medium text-slate-900">Upload Vendor Bill</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bill / Invoice File *</label>
                <input type="file" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 border border-slate-300 rounded-md p-1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bill Amount (INR)</label>
                <input type="number" value={billAmount} onChange={e => setBillAmount(e.target.value)} className="w-full border border-slate-300 rounded-md p-2 text-sm" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea value={billNotes} onChange={e => setBillNotes(e.target.value)} className="w-full border border-slate-300 rounded-md p-2 text-sm h-24" placeholder="Any remarks about this bill..."></textarea>
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row justify-end gap-3 bg-slate-50">
              <button onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-md text-sm font-medium">Cancel</button>
              <button onClick={handleUploadBill} className="w-full sm:w-auto px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 flex items-center justify-center gap-2 text-sm font-medium">
                <Upload className="w-4 h-4" /> Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
