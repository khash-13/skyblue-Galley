import React, { useEffect, useState } from 'react';
import { getVendors, Vendor, saveVendor, deleteVendor } from '../services/db';
import { Link } from 'react-router-dom';
import { Store, Upload, Plus, MapPin, Phone, Mail, Edit2, Trash2, X } from 'lucide-react';

export default function Vendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState<Vendor | null>(null);
  const [newVendor, setNewVendor] = useState<Partial<Vendor>>({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    serviceAirports: [],
    deliveryOptions: [],
    currency: 'INR',
    taxNotes: '',
    notes: ''
  });
  const [airportInput, setAirportInput] = useState('');

  const loadData = () => {
    setLoading(true);
    getVendors().then(data => {
      setVendors(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddVendor = async () => {
    if (!newVendor.name || !newVendor.email) return;
    await saveVendor(newVendor as Vendor);
    setIsModalOpen(false);
    setNewVendor({
      name: '', contactPerson: '', phone: '', email: '', address: '', serviceAirports: [], deliveryOptions: [], currency: 'INR', taxNotes: '', notes: ''
    });
    loadData();
  };

  const handleEditVendor = (vendor: Vendor) => {
    setNewVendor(vendor);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (vendorToDelete?.id) {
      await deleteVendor(vendorToDelete.id);
      loadData();
      setVendorToDelete(null);
    }
  };

  const addAirport = () => {
    if (airportInput && !newVendor.serviceAirports?.includes(airportInput)) {
      setNewVendor({
        ...newVendor,
        serviceAirports: [...(newVendor.serviceAirports || []), airportInput.toUpperCase()]
      });
      setAirportInput('');
    }
  };

  const removeAirport = (airport: string) => {
    setNewVendor({
      ...newVendor,
      serviceAirports: newVendor.serviceAirports?.filter(a => a !== airport)
    });
  };

  const toggleDeliveryOption = (option: string) => {
    const currentOptions = newVendor.deliveryOptions || [];
    if (currentOptions.includes(option)) {
      setNewVendor({ ...newVendor, deliveryOptions: currentOptions.filter(o => o !== option) });
    } else {
      setNewVendor({ ...newVendor, deliveryOptions: [...currentOptions, option] });
    }
  };

  const deliveryOptionsList = ['FBO Delivery', 'Ramp Delivery', 'Pickup at Kitchen', 'Hotel Lobby Pickup', 'Airport Terminal'];

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vendors</h1>
          <p className="text-slate-500 text-sm">{vendors.length} vendors registered</p>
        </div>
        <button onClick={() => {
          setNewVendor({ name: '', contactPerson: '', phone: '', email: '', address: '', serviceAirports: [], deliveryOptions: [], currency: 'INR', taxNotes: '', notes: '' });
          setIsModalOpen(true);
        }} className="w-full sm:w-auto bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-800 flex items-center justify-center gap-2 text-sm font-medium">
          <Plus className="w-4 h-4" /> Add Vendor
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading...</div>
        ) : vendors.map(vendor => (
          <div key={vendor.id} className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:bg-slate-50 transition-colors">
            <div className="flex items-start gap-4 min-w-0">
              <div className="p-3 bg-slate-100 rounded-lg text-slate-600 shrink-0 hidden sm:block">
                <Store className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">{vendor.name}</h3>
                  <div className="flex flex-wrap gap-1">
                    {vendor.serviceAirports?.map(airport => (
                      <span key={airport} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium border border-slate-200">{airport}</span>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs sm:text-sm text-slate-500">
                  <span className="flex items-center gap-1.5 truncate"><Phone className="w-3.5 h-3.5 shrink-0" /> {vendor.phone}</span>
                  <span className="flex items-center gap-1.5 truncate"><Mail className="w-3.5 h-3.5 shrink-0" /> {vendor.email}</span>
                  <span className="flex items-center gap-1.5 truncate sm:col-span-2"><MapPin className="w-3.5 h-3.5 shrink-0" /> {vendor.address}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between sm:justify-start lg:justify-between gap-4 shrink-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100">
              <div className="flex items-center gap-2 order-2 sm:order-1 lg:order-none">
                <button onClick={() => handleEditVendor(vendor)} className="p-2 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => setVendorToDelete(vendor)} className="p-2 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="text-left lg:text-right order-1 sm:order-2 lg:order-none">
                <p className="text-sm font-medium text-slate-900">0 items</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{vendor.currency}</p>
              </div>
              <div className="flex flex-wrap gap-3 mt-0 sm:mt-2 order-3 w-full sm:w-auto">
                <Link to={`/vendors/${vendor.id}/menu`} className="flex-1 sm:flex-none justify-center text-xs sm:text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1.5 font-medium px-3 py-1.5 bg-slate-50 rounded-md border border-slate-200">
                  <Store className="w-4 h-4" /> Menu
                </Link>
                <Link to={`/vendors/${vendor.id}/import`} className="flex-1 sm:flex-none justify-center text-xs sm:text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1.5 font-medium px-3 py-1.5 bg-slate-50 rounded-md border border-slate-200">
                  <Upload className="w-4 h-4" /> Import
                </Link>
              </div>
            </div>
          </div>
        ))}
        {vendors.length === 0 && !loading && (
          <div className="p-12 text-center text-slate-500 bg-white rounded-lg border border-dashed border-slate-300">
            No vendors found. Add a vendor to get started.
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-none sm:rounded-lg shadow-xl w-full max-w-2xl h-full sm:h-auto sm:max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white z-10 shrink-0">
              <h2 className="text-lg font-bold text-slate-900">{newVendor.id ? 'Edit Vendor' : 'Add New Vendor'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Vendor / Company Name *</label>
                <input type="text" value={newVendor.name} onChange={e => setNewVendor({...newVendor, name: e.target.value})} className="w-full border border-slate-300 rounded-md p-2 text-sm" placeholder="Skyline Catering Dubai" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contact Person</label>
                  <input type="text" value={newVendor.contactPerson} onChange={e => setNewVendor({...newVendor, contactPerson: e.target.value})} className="w-full border border-slate-300 rounded-md p-2 text-sm" placeholder="Ahmed Al-Rashid" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input type="tel" value={newVendor.phone} onChange={e => setNewVendor({...newVendor, phone: e.target.value})} className="w-full border border-slate-300 rounded-md p-2 text-sm" placeholder="+971-4-555-0123" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input type="email" value={newVendor.email} onChange={e => setNewVendor({...newVendor, email: e.target.value})} className="w-full border border-slate-300 rounded-md p-2 text-sm" placeholder="orders@skylinecatering.ae" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                <textarea value={newVendor.address} onChange={e => setNewVendor({...newVendor, address: e.target.value})} className="w-full border border-slate-300 rounded-md p-2 text-sm h-20" placeholder="Hangar 7, Al Maktoum Int'l Airport, Dubai"></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Service Airports *</label>
                <div className="flex gap-2 mb-2">
                  <input 
                    type="text" 
                    value={airportInput} 
                    onChange={e => setAirportInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAirport())}
                    className="flex-1 border border-slate-300 rounded-md p-2 text-sm" 
                    placeholder="Enter IATA code (e.g. DXB)" 
                  />
                  <button type="button" onClick={addAirport} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 text-sm font-medium">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {newVendor.serviceAirports?.map(airport => (
                    <span key={airport} className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium border border-slate-200 flex items-center gap-1">
                      {airport}
                      <button type="button" onClick={() => removeAirport(airport)} className="text-slate-400 hover:text-slate-600">×</button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Delivery / Pickup Options</label>
                <div className="flex flex-wrap gap-2">
                  {deliveryOptionsList.map(option => (
                    <button 
                      key={option}
                      type="button"
                      onClick={() => toggleDeliveryOption(option)}
                      className={`px-3 py-1.5 text-[10px] sm:text-xs rounded-full border ${newVendor.deliveryOptions?.includes(option) ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
                  <select value={newVendor.currency} onChange={e => setNewVendor({...newVendor, currency: e.target.value})} className="w-full border border-slate-300 rounded-md p-2 text-sm">
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="AED">AED</option>
                    <option value="INR">INR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tax / Service Charge Notes</label>
                  <input type="text" value={newVendor.taxNotes} onChange={e => setNewVendor({...newVendor, taxNotes: e.target.value})} className="w-full border border-slate-300 rounded-md p-2 text-sm" placeholder="5% VAT included" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Lead Time Notes</label>
                <textarea value={newVendor.notes} onChange={e => setNewVendor({...newVendor, notes: e.target.value})} className="w-full border border-slate-300 rounded-md p-2 text-sm h-20" placeholder="Minimum 6 hours. Same-day possible with surcharge."></textarea>
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row justify-end gap-3 bg-slate-50 shrink-0">
              <button onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-md text-sm font-medium">Cancel</button>
              <button onClick={handleAddVendor} className="w-full sm:w-auto px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 text-sm font-medium">{newVendor.id ? 'Save Changes' : 'Add Vendor'}</button>
            </div>
          </div>
        </div>
      )}

      {vendorToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="font-medium text-slate-900">Confirm Deletion</h2>
              <button onClick={() => setVendorToDelete(null)} className="text-slate-400 hover:text-slate-600 p-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-slate-600">Are you sure you want to delete <strong>{vendorToDelete.name}</strong>?</p>
              <p className="text-sm text-slate-500 mt-2">This action cannot be undone.</p>
            </div>
            <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row justify-end gap-3 bg-slate-50">
              <button onClick={() => setVendorToDelete(null)} className="w-full sm:w-auto px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-md text-sm font-medium">Cancel</button>
              <button onClick={confirmDelete} className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium">Delete Vendor</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
