import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getVendor, Vendor, getVendorMenuItems, VendorMenuItem, saveVendorMenuItem, deleteVendorMenuItem, getCatalogItems, CatalogItem } from '../services/db';
import { ArrowLeft, Plus, Trash2, Edit2, Search, X } from 'lucide-react';

export default function VendorMenu() {
  const { id } = useParams<{ id: string }>();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [menuItems, setMenuItems] = useState<VendorMenuItem[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<VendorMenuItem | null>(null);
  const [newItem, setNewItem] = useState<Partial<VendorMenuItem>>({
    name: '', description: '', price: 0, category: '', dietaryTags: [], allergens: []
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showCatalogSearch, setShowCatalogSearch] = useState(false);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    const [v, items, catalog] = await Promise.all([
      getVendor(id),
      getVendorMenuItems(id),
      getCatalogItems()
    ]);
    setVendor(v);
    setMenuItems(items);
    setCatalogItems(catalog);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleSaveItem = async () => {
    if (!newItem.name || !id) return;
    await saveVendorMenuItem({ ...newItem, vendorId: id, currency: vendor?.currency || 'USD' } as VendorMenuItem);
    setIsModalOpen(false);
    loadData();
  };

  const handleEditItem = (item: VendorMenuItem) => {
    setNewItem(item);
    setIsModalOpen(true);
    setShowCatalogSearch(false);
  };

  const confirmDelete = async () => {
    if (itemToDelete?.id) {
      await deleteVendorMenuItem(itemToDelete.id);
      loadData();
      setItemToDelete(null);
    }
  };

  const handleSelectCatalogItem = (catalogItem: CatalogItem) => {
    setNewItem({
      ...newItem,
      name: catalogItem.name,
      category: catalogItem.category,
      dietaryTags: catalogItem.dietaryTags || [],
      allergens: catalogItem.allergens || [],
      catalogItemId: catalogItem.id
    });
    setShowCatalogSearch(false);
  };

  const filteredCatalog = catalogItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center text-slate-500">Loading...</div>;
  if (!vendor) return <div className="p-8 text-center text-red-500">Vendor not found</div>;

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <Link to="/vendors" className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Vendors
        </Link>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{vendor.name} - Menu</h1>
            <p className="text-slate-500 text-sm">{menuItems.length} items available</p>
          </div>
          <button onClick={() => {
            setNewItem({ name: '', description: '', price: 0, category: '', dietaryTags: [], allergens: [] });
            setIsModalOpen(true);
            setShowCatalogSearch(false);
          }} className="w-full sm:w-auto bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-800 flex items-center justify-center gap-2 text-sm font-medium">
            <Plus className="w-4 h-4" /> Add Menu Item
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="divide-y divide-slate-100">
          {menuItems.map(item => (
            <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium text-slate-900 text-sm sm:text-base truncate">{item.name}</h3>
                  {item.catalogItemId && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-medium border border-blue-200">Linked</span>}
                </div>
                <p className="text-xs sm:text-sm text-slate-500 truncate">{item.category} • {item.description}</p>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                <div className="text-left sm:text-right">
                  <p className="font-medium text-slate-900 text-sm sm:text-base">{item.price} {item.currency}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleEditItem(item)} className="p-2 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setItemToDelete(item)} className="p-2 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {menuItems.length === 0 && (
            <div className="p-12 text-center text-slate-500 bg-white">
              No menu items found. Add items to your menu.
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-none sm:rounded-lg shadow-xl w-full max-w-4xl h-full sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col sm:flex-row">
            
            {/* Left Side: Catalog Search (Collapsible on mobile) */}
            <div className={`w-full sm:w-1/2 border-r border-slate-200 flex flex-col bg-slate-50 ${showCatalogSearch ? 'flex' : 'hidden sm:flex'}`}>
              <div className="p-4 border-b border-slate-200 flex justify-between items-center shrink-0">
                <h3 className="font-medium text-slate-900">Link from Global Catalog</h3>
                <button onClick={() => setShowCatalogSearch(false)} className="sm:hidden text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 border-b border-slate-200 shrink-0">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search catalog..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {filteredCatalog.map(catItem => (
                  <button 
                    key={catItem.id}
                    onClick={() => handleSelectCatalogItem(catItem)}
                    className="w-full text-left p-3 hover:bg-white rounded-md border border-transparent hover:border-slate-200 transition-colors mb-1"
                  >
                    <p className="font-medium text-slate-900 text-sm">{catItem.name}</p>
                    <p className="text-[10px] text-slate-500">{catItem.category} • {catItem.type}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Side: Item Details */}
            <div className={`w-full ${showCatalogSearch ? 'hidden sm:flex' : 'flex'} sm:w-1/2 flex flex-col bg-white`}>
              <div className="p-4 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white z-10 shrink-0">
                <h2 className="text-lg font-bold text-slate-900">{newItem.id ? 'Edit Menu Item' : 'Add Menu Item'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto">
                <button 
                  onClick={() => setShowCatalogSearch(true)}
                  className="sm:hidden w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-md text-sm font-medium border border-slate-200 mb-4"
                >
                  <Search className="w-4 h-4" /> Link from Catalog
                </button>

                {newItem.catalogItemId && (
                  <div className="bg-blue-50 text-blue-700 p-3 rounded-md text-xs mb-4 border border-blue-100 flex items-center justify-between">
                    <span>Linked to global catalog item.</span>
                    <button onClick={() => setNewItem({...newItem, catalogItemId: undefined})} className="text-blue-500 hover:text-blue-700 font-medium underline">Unlink</button>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Item Name *</label>
                  <input type="text" value={newItem.name || ''} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full border border-slate-300 rounded-md p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                  <input type="text" value={newItem.category || ''} onChange={e => setNewItem({...newItem, category: e.target.value})} className="w-full border border-slate-300 rounded-md p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea value={newItem.description || ''} onChange={e => setNewItem({...newItem, description: e.target.value})} className="w-full border border-slate-300 rounded-md p-2 text-sm h-20"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Price ({vendor.currency}) *</label>
                  <input type="number" min="0" step="0.01" value={newItem.price || 0} onChange={e => setNewItem({...newItem, price: parseFloat(e.target.value) || 0})} className="w-full border border-slate-300 rounded-md p-2 text-sm" />
                </div>
              </div>
              <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row justify-end gap-3 bg-slate-50 shrink-0">
                <button onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-md text-sm font-medium">Cancel</button>
                <button onClick={handleSaveItem} className="w-full sm:w-auto px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 text-sm font-medium">Save Item</button>
              </div>
            </div>

          </div>
        </div>
      )}

      {itemToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="font-medium text-slate-900">Confirm Deletion</h2>
              <button onClick={() => setItemToDelete(null)} className="text-slate-400 hover:text-slate-600 p-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-slate-600">Are you sure you want to delete <strong>{itemToDelete.name}</strong>?</p>
              <p className="text-sm text-slate-500 mt-2">This action cannot be undone.</p>
            </div>
            <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row justify-end gap-3 bg-slate-50">
              <button onClick={() => setItemToDelete(null)} className="w-full sm:w-auto px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-md text-sm font-medium">Cancel</button>
              <button onClick={confirmDelete} className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium">Delete Item</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
