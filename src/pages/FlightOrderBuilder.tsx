import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { getFlight, saveFlight, FlightOrder, getVendors, Vendor, getVendorMenuItems, VendorMenuItem, getCatalogItems, CatalogItem, OrderItem } from '../services/db';
import { useAuth } from '../contexts/AuthContext';
import { DownloadPDFButton } from '../components/OrderPDF';
import { Plus, Search, Filter } from 'lucide-react';

export default function FlightOrderBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [order, setOrder] = useState<FlightOrder | null>(null);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogFilter, setCatalogFilter] = useState<'All' | 'food' | 'grocery'>('All');

  const { register, control, handleSubmit, reset, watch } = useForm<FlightOrder>({
    defaultValues: {
      flightNumber: '', tailNumber: '', departure: '', arrival: '',
      date: new Date().toISOString().slice(0, 16),
      paxCount: 1, crewCount: 1, dietaryNotes: '', status: 'Draft',
      items: []
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const currentStatus = watch('status');
  const selectedVendorId = watch('vendorId');
  const selectedVendor = vendors.find(v => v.id === selectedVendorId);

  useEffect(() => {
    Promise.all([getVendors(), getCatalogItems()]).then(([vData, cData]) => {
      setVendors(vData);
      setCatalog(cData);
    });
    
    if (id) {
      getFlight(id).then(data => {
        if (data) {
          setOrder(data);
          reset(data);
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [id, reset]);

  const splitOrderLogic = async (data: FlightOrder): Promise<FlightOrder[]> => {
    // 1. Fetch all vendor menu items
    const allVendorItems: VendorMenuItem[] = [];
    for (const v of vendors) {
      if (v.id) {
        const items = await getVendorMenuItems(v.id);
        allVendorItems.push(...items);
      }
    }

    // 2. Group items by best vendor
    let remainingItems = [...data.items];
    const ordersToCreate: FlightOrder[] = [];

    while (remainingItems.length > 0) {
      const vendorCounts: Record<string, OrderItem[]> = {};
      
      for (const item of remainingItems) {
        const matchingVendorItems = allVendorItems.filter(vi => 
          (item.itemId && vi.catalogItemId === item.itemId) || 
          (vi.name.toLowerCase() === item.name.toLowerCase())
        );
        
        const uniqueVendorIds = Array.from(new Set(matchingVendorItems.map(vi => vi.vendorId)));
        
        for (const vId of uniqueVendorIds) {
          if (!vendorCounts[vId]) vendorCounts[vId] = [];
          const vItem = matchingVendorItems.find(vi => vi.vendorId === vId);
          vendorCounts[vId].push({
            ...item,
            price: vItem?.price || item.price
          });
        }
      }

      let bestVendorId = null;
      let maxItems = 0;
      for (const [vId, items] of Object.entries(vendorCounts)) {
        if (items.length > maxItems) {
          maxItems = items.length;
          bestVendorId = vId;
        }
      }

      if (bestVendorId && maxItems > 0) {
        const itemsForThisVendor = vendorCounts[bestVendorId];
        ordersToCreate.push({
          ...data,
          vendorId: bestVendorId,
          items: itemsForThisVendor
        });
        
        remainingItems = remainingItems.filter(ri => 
          !itemsForThisVendor.some(ivi => ivi.name === ri.name)
        );
      } else {
        ordersToCreate.push({
          ...data,
          vendorId: '', // Unassigned
          items: remainingItems
        });
        break;
      }
    }

    return ordersToCreate;
  };

  const onSubmit = async (data: FlightOrder) => {
    if (!data.createdBy) data.createdBy = user?.uid || '';
    
    // Run auto-vendor assignment and split logic
    const splitOrders = await splitOrderLogic(data);
    
    if (splitOrders.length === 0) {
      // Fallback if no items
      await saveFlight(data);
      navigate('/flights');
      return;
    }

    if (!id) {
      // New order
      for (const splitOrder of splitOrders) {
        await saveFlight(splitOrder);
      }
      navigate('/flights');
    } else {
      // Existing order: update the first one with the current ID, create new ones for the rest
      const firstOrder = splitOrders[0];
      await saveFlight({ ...firstOrder, id }); // Keep the original ID
      
      for (let i = 1; i < splitOrders.length; i++) {
        await saveFlight(splitOrders[i]); // Create new orders
      }
      navigate('/flights');
    }
  };

  const submitForApproval = async () => {
    const data = watch();
    data.status = 'Submitted';
    await onSubmit(data);
  };

  const addCatalogItem = (item: CatalogItem) => {
    append({ itemId: item.id || '', name: item.name, type: item.type, quantity: item.defaultQty || 1, notes: '' });
  };

  if (loading) return <div className="p-8">Loading...</div>;

  const isReadOnly = currentStatus !== 'Draft' && currentStatus !== 'Rejected';

  const filteredCatalog = catalog.filter(item => {
    if (catalogFilter !== 'All' && item.type !== catalogFilter) return false;
    if (catalogSearch && !item.name.toLowerCase().includes(catalogSearch.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 sm:gap-8">
      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{id ? 'Edit Order' : 'New Order'}</h1>
            <p className="text-slate-500 text-sm">Status: <span className="font-semibold">{currentStatus}</span></p>
            <p className="text-xs text-blue-600 mt-1 max-w-md">Items will be automatically assigned to the best vendors upon saving. Orders may be split if items require multiple vendors.</p>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {(currentStatus === 'Approved' || currentStatus === 'Submitted') && order && (
              <DownloadPDFButton order={order} vendor={selectedVendor} />
            )}
            {!isReadOnly && (
              <>
                <button onClick={handleSubmit(onSubmit)} className="flex-1 sm:flex-none bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-md hover:bg-slate-50 text-xs sm:text-sm font-medium">
                  Save Draft
                </button>
                <button onClick={handleSubmit(submitForApproval)} className="flex-1 sm:flex-none bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-800 text-xs sm:text-sm font-medium">
                  Submit for Approval
                </button>
              </>
            )}
          </div>
        </div>

        <form className="space-y-6">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Flight Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Flight Number</label>
                <input disabled={isReadOnly} {...register('flightNumber')} className="w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 border p-2 text-sm" placeholder="e.g. JG-101" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tail Number</label>
                <input disabled={isReadOnly} {...register('tailNumber')} className="w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 border p-2 text-sm" placeholder="e.g. N12345" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Departure</label>
                <input disabled={isReadOnly} {...register('departure')} className="w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 border p-2 text-sm" placeholder="e.g. DXB" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Arrival</label>
                <input disabled={isReadOnly} {...register('arrival')} className="w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 border p-2 text-sm" placeholder="e.g. LHR" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date/Time</label>
                <input disabled={isReadOnly} type="datetime-local" {...register('date')} className="w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 border p-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pax Count</label>
                  <input disabled={isReadOnly} type="number" {...register('paxCount')} className="w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 border p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Crew Count</label>
                  <input disabled={isReadOnly} type="number" {...register('crewCount')} className="w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 border p-2 text-sm" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-900">Order Items</h2>
              {!isReadOnly && (
                <button type="button" onClick={() => append({ itemId: '', name: '', type: 'custom', quantity: 1, notes: '' })} className="text-xs sm:text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium">
                  <Plus className="w-4 h-4" /> Add Custom Item
                </button>
              )}
            </div>
            
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead>
                  <tr>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase pb-2">Item Name</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase pb-2 w-24">Qty</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase pb-2">Notes</th>
                    {!isReadOnly && <th className="w-10"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fields.map((field, index) => (
                    <tr key={field.id}>
                      <td className="py-2 pr-2"><input disabled={isReadOnly} {...register(`items.${index}.name`)} className="w-full border-slate-300 rounded-md border p-2 text-sm" placeholder="Item name" /></td>
                      <td className="py-2 pr-2"><input disabled={isReadOnly} type="number" {...register(`items.${index}.quantity`)} className="w-full border-slate-300 rounded-md border p-2 text-sm" /></td>
                      <td className="py-2 pr-2"><input disabled={isReadOnly} {...register(`items.${index}.notes`)} className="w-full border-slate-300 rounded-md border p-2 text-sm" placeholder="Optional notes" /></td>
                      {!isReadOnly && (
                        <td className="py-2 text-right">
                          <button type="button" onClick={() => remove(index)} className="text-slate-400 hover:text-slate-600 p-1">×</button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="p-3 border border-slate-100 rounded-lg bg-slate-50 relative">
                  {!isReadOnly && (
                    <button type="button" onClick={() => remove(index)} className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 p-1">×</button>
                  )}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-medium text-slate-500 uppercase mb-1">Item Name</label>
                      <input disabled={isReadOnly} {...register(`items.${index}.name`)} className="w-full border-slate-300 rounded-md border p-2 text-sm bg-white" placeholder="Item name" />
                    </div>
                    <div className="flex gap-3">
                      <div className="w-24">
                        <label className="block text-[10px] font-medium text-slate-500 uppercase mb-1">Qty</label>
                        <input disabled={isReadOnly} type="number" {...register(`items.${index}.quantity`)} className="w-full border-slate-300 rounded-md border p-2 text-sm bg-white" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[10px] font-medium text-slate-500 uppercase mb-1">Notes</label>
                        <input disabled={isReadOnly} {...register(`items.${index}.notes`)} className="w-full border-slate-300 rounded-md border p-2 text-sm bg-white" placeholder="Optional notes" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {fields.length === 0 && (
              <div className="py-8 text-center text-slate-500 text-sm">No items added yet. Select from the catalog.</div>
            )}
          </div>
        </form>
      </div>

      {!isReadOnly && (
        <div className="w-full lg:w-80 shrink-0">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 sticky top-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900">Global Catalog</h3>
              <div className="flex gap-1">
                <button className="p-1 text-slate-400 hover:text-slate-600"><Filter className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search catalog..." 
                value={catalogSearch}
                onChange={e => setCatalogSearch(e.target.value)}
                className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2 text-sm" 
              />
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              <button onClick={() => setCatalogFilter('All')} className={`px-3 py-1 text-[10px] sm:text-xs font-medium rounded-full ${catalogFilter === 'All' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>All</button>
              <button onClick={() => setCatalogFilter('food')} className={`px-3 py-1 text-[10px] sm:text-xs font-medium rounded-full ${catalogFilter === 'food' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Food</button>
              <button onClick={() => setCatalogFilter('grocery')} className={`px-3 py-1 text-[10px] sm:text-xs font-medium rounded-full ${catalogFilter === 'grocery' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Grocery</button>
            </div>
            <div className="space-y-2 max-h-[40vh] lg:max-h-[60vh] overflow-y-auto pr-1">
              {filteredCatalog.map(item => (
                <div key={item.id} className="flex justify-between items-center text-sm p-3 hover:bg-slate-50 rounded-md border border-slate-100 transition-colors">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">{item.name}</p>
                    <p className="text-[10px] sm:text-xs text-slate-500">{item.category} • {item.unit}</p>
                  </div>
                  <button type="button" onClick={() => addCatalogItem(item)} className="text-slate-600 hover:text-slate-900 hover:bg-slate-200 font-medium p-1.5 bg-slate-100 rounded-md transition-colors shrink-0 ml-2">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {filteredCatalog.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No items found.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
