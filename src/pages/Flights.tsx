import React, { useEffect, useState } from 'react';
import { getFlights, FlightOrder, saveFlight, getVendors, Vendor } from '../services/db';
import { Plus, Plane, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Flights() {
  const [flights, setFlights] = useState<FlightOrder[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [newFlight, setNewFlight] = useState<Partial<FlightOrder>>({
    date: new Date().toISOString().slice(0, 10),
    departureTime: '',
    departure: '',
    arrival: '',
    flightNumber: '',
    tailNumber: '',
    paxCount: 1,
    crewCount: 1,
    timezone: 'GST (UTC+4)',
    pickupLocation: '',
    dietaryNotes: '',
    serviceStyleNotes: '',
    specialInstructions: '',
    status: 'Draft',
    items: []
  });

  const loadData = () => {
    setLoading(true);
    Promise.all([getFlights(), getVendors()]).then(([fData, vData]) => {
      setFlights(fData);
      setVendors(vData);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateFlight = async () => {
    const flightToSave = {
      ...newFlight,
      createdBy: user?.uid || '',
      date: `${newFlight.date}T${newFlight.departureTime || '00:00'}:00.000Z`
    };
    const newId = await saveFlight(flightToSave);
    setIsModalOpen(false);
    navigate(`/flights/${newId}`);
  };

  const upcomingFlights = flights.filter(f => new Date(f.date) >= new Date());

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Flights</h1>
          <p className="text-slate-500">{upcomingFlights.length} upcoming flights</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-800 flex items-center justify-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Add Flight
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center text-slate-500">Loading...</div>
        ) : upcomingFlights.map(flight => {
          const date = new Date(flight.date);
          return (
            <div key={flight.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 transition-colors gap-4">
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="text-center w-12 sm:w-16 shrink-0">
                  <p className="text-[10px] sm:text-xs text-slate-500 uppercase font-semibold">{date.toLocaleString('default', { month: 'short' })}</p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900">{date.getDate()}</p>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">{flight.departure} <Plane className="w-3 h-3 sm:w-4 sm:h-4 inline mx-1 text-slate-400" /> {flight.arrival}</h3>
                    <span className="text-xs sm:text-sm font-medium text-slate-500">{flight.flightNumber}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500">
                    {flight.departureTime || date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {flight.paxCount} pax • {flight.crewCount} crew • {flight.tailNumber}
                  </p>
                  {flight.vendorId && (
                    <p className="text-[10px] sm:text-xs text-slate-400 mt-1">
                      Vendor: <span className="font-medium">{vendors.find(v => v.id === flight.vendorId)?.name || 'Unknown'}</span>
                    </p>
                  )}
                  {!flight.vendorId && flight.items.length > 0 && (
                    <p className="text-[10px] sm:text-xs text-amber-500 mt-1 font-medium">Unassigned Items</p>
                  )}
                </div>
              </div>
              <div className="flex justify-end">
                <Link to={`/flights/${flight.id}`} className="w-full sm:w-auto text-center px-4 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 text-xs sm:text-sm font-medium">
                  Manage Order
                </Link>
              </div>
            </div>
          );
        })}
        {upcomingFlights.length === 0 && !loading && (
          <div className="p-8 text-center text-slate-500 bg-white rounded-lg border border-slate-200">No upcoming flights found.</div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-none sm:rounded-lg shadow-xl w-full max-w-2xl h-full sm:h-auto sm:max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white z-10 shrink-0">
              <h2 className="text-lg font-bold text-slate-900">Add New Flight</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                  <input type="date" value={newFlight.date || ''} onChange={e => setNewFlight({...newFlight, date: e.target.value})} className="w-full border border-slate-300 rounded-md p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Departure Time</label>
                  <input type="time" value={newFlight.departureTime || ''} onChange={e => setNewFlight({...newFlight, departureTime: e.target.value})} className="w-full border border-slate-300 rounded-md p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Departure Airport (ICAO/IATA) *</label>
                  <input type="text" value={newFlight.departure || ''} onChange={e => setNewFlight({...newFlight, departure: e.target.value})} className="w-full border border-slate-300 rounded-md p-2 text-sm" placeholder="DXB" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Arrival Airport *</label>
                  <input type="text" value={newFlight.arrival || ''} onChange={e => setNewFlight({...newFlight, arrival: e.target.value})} className="w-full border border-slate-300 rounded-md p-2 text-sm" placeholder="NCE" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Flight Number</label>
                  <input type="text" value={newFlight.flightNumber || ''} onChange={e => setNewFlight({...newFlight, flightNumber: e.target.value})} className="w-full border border-slate-300 rounded-md p-2 text-sm" placeholder="PJ-101" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tail Number</label>
                  <input type="text" value={newFlight.tailNumber || ''} onChange={e => setNewFlight({...newFlight, tailNumber: e.target.value})} className="w-full border border-slate-300 rounded-md p-2 text-sm" placeholder="VP-BDJ" />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Passengers *</label>
                  <input type="number" min="0" value={newFlight.paxCount || 0} onChange={e => setNewFlight({...newFlight, paxCount: parseInt(e.target.value) || 0})} className="w-full border border-slate-300 rounded-md p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Crew *</label>
                  <input type="number" min="0" value={newFlight.crewCount || 0} onChange={e => setNewFlight({...newFlight, crewCount: parseInt(e.target.value) || 0})} className="w-full border border-slate-300 rounded-md p-2 text-sm" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Timezone</label>
                  <select value={newFlight.timezone || 'UTC'} onChange={e => setNewFlight({...newFlight, timezone: e.target.value})} className="w-full border border-slate-300 rounded-md p-2 text-sm">
                    <option value="GST (UTC+4)">GST (UTC+4)</option>
                    <option value="UTC">UTC</option>
                    <option value="EST (UTC-5)">EST (UTC-5)</option>
                    <option value="PST (UTC-8)">PST (UTC-8)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pickup / Delivery Location</label>
                <input type="text" value={newFlight.pickupLocation || ''} onChange={e => setNewFlight({...newFlight, pickupLocation: e.target.value})} className="w-full border border-slate-300 rounded-md p-2 text-sm" placeholder="Jetex FBO, Dubai" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Dietary Notes</label>
                  <textarea value={newFlight.dietaryNotes || ''} onChange={e => setNewFlight({...newFlight, dietaryNotes: e.target.value})} className="w-full border border-slate-300 rounded-md p-2 text-sm h-24" placeholder="1 pax halal, 1 pax gluten-free"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Service Style Notes</label>
                  <textarea value={newFlight.serviceStyleNotes || ''} onChange={e => setNewFlight({...newFlight, serviceStyleNotes: e.target.value})} className="w-full border border-slate-300 rounded-md p-2 text-sm h-24" placeholder="Full breakfast on departure"></textarea>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Special Instructions</label>
                <textarea value={newFlight.specialInstructions || ''} onChange={e => setNewFlight({...newFlight, specialInstructions: e.target.value})} className="w-full border border-slate-300 rounded-md p-2 text-sm h-24" placeholder="Birthday cake for Mr. Al-Rashid"></textarea>
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row justify-end gap-3 bg-slate-50 shrink-0">
              <button onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-md text-sm font-medium">Cancel</button>
              <button onClick={handleCreateFlight} className="w-full sm:w-auto px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 text-sm font-medium">Create Flight</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
