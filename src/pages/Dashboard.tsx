import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getFlights, FlightOrder } from '../services/db';
import { Plus, PlaneTakeoff, Database, Plane, ShoppingBasket, CheckSquare } from 'lucide-react';
import { seedData } from '../lib/seed';

export default function Dashboard() {
  const [flights, setFlights] = useState<FlightOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    getFlights().then(data => {
      setFlights(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSeed = async () => {
    await seedData();
    loadData();
    alert('Data seeded successfully!');
  };

  const upcomingFlights = flights.filter(f => new Date(f.date) >= new Date());
  const activeOrders = flights.filter(f => f.status !== 'Completed' && f.status !== 'Rejected');
  const pendingApprovals = flights.filter(f => f.status === 'Submitted');

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500">Welcome back. Here's your overview.</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <button onClick={handleSeed} className="flex-1 sm:flex-none bg-slate-100 text-slate-700 px-4 py-2 rounded-md hover:bg-slate-200 flex items-center justify-center gap-2 text-sm">
            <Database className="w-4 h-4" /> Seed Data
          </button>
          <Link 
            to="/flights/new" 
            className="flex-1 sm:flex-none bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-800 flex items-center justify-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" /> New Flight
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <Plane className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{upcomingFlights.length}</p>
            <p className="text-sm text-slate-500">Upcoming Flights</p>
          </div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
            <ShoppingBasket className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{activeOrders.length}</p>
            <p className="text-sm text-slate-500">Active Orders</p>
          </div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-yellow-50 flex items-center justify-center text-yellow-600 shrink-0">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{pendingApprovals.length}</p>
            <p className="text-sm text-slate-500">Pending Approvals</p>
          </div>
        </div>
      </div>

      <div className="space-y-6 sm:space-y-8">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-medium text-slate-900">Upcoming Flights</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading...</div>
            ) : upcomingFlights.slice(0, 5).map(flight => (
              <div key={flight.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 gap-4">
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="text-center w-10 sm:w-12 shrink-0">
                    <p className="text-[10px] sm:text-xs text-slate-500 uppercase">{new Date(flight.date).toLocaleString('default', { month: 'short' })}</p>
                    <p className="text-lg sm:text-xl font-bold text-slate-900">{new Date(flight.date).getDate()}</p>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium text-slate-900 text-sm sm:text-base break-words">{flight.departure} → {flight.arrival}</h3>
                      <span className="text-xs text-slate-500 whitespace-nowrap">{flight.flightNumber}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500">
                      {new Date(flight.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {flight.paxCount} pax • {flight.crewCount} crew
                    </p>
                  </div>
                </div>
                <div className="flex justify-start sm:justify-end shrink-0">
                  <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap">{flight.status}</span>
                </div>
              </div>
            ))}
            {upcomingFlights.length === 0 && !loading && (
              <div className="p-8 text-center text-slate-500">No upcoming flights.</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-medium text-slate-900">Recent Orders</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading...</div>
            ) : flights.slice(0, 5).map(order => (
              <Link to={`/flights/${order.id}`} key={order.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 gap-4 cursor-pointer transition-colors">
                <div className="min-w-0">
                  <h3 className="font-medium text-slate-900 text-sm sm:text-base truncate">Order #{order.id?.slice(0,6)} - {order.departure} → {order.arrival}</h3>
                  <p className="text-xs sm:text-sm text-slate-500 truncate">
                    {order.items.length} items • by {order.createdBy}
                  </p>
                </div>
                <div className="flex justify-start sm:justify-end shrink-0">
                  <span className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap ${
                    order.status === 'Cancelled' || order.status === 'Rejected' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-slate-100 text-slate-700'
                  }`}>{order.status}</span>
                </div>
              </Link>
            ))}
            {flights.length === 0 && !loading && (
              <div className="p-8 text-center text-slate-500">No recent orders.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
