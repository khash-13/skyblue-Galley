import React, { useEffect, useState } from 'react';
import { getCatalogItems, CatalogItem, saveCatalogItem, deleteCatalogItem } from '../services/db';
import { Plus, Star, Trash2, Edit2, X } from 'lucide-react';

export default function FoodCatalog() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<CatalogItem | null>(null);
  const [newItem, setNewItem] = useState<Partial<CatalogItem>>({
    type: 'food',
    name: '',
    category: '',
    subcategory: '',
    unit: 'portion',
    defaultQty: 1,
    isFavorite: false,
    dietaryTags: [],
    allergens: [],
    notes: ''
  });

  const loadData = () => {
    setLoading(true);
    getCatalogItems('food').then(data => {
      setItems(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.category) return;
    await saveCatalogItem(newItem as CatalogItem);
    setIsModalOpen(false);
    setNewItem({
      type: 'food', name: '', category: '', subcategory: '', unit: 'portion', defaultQty: 1, isFavorite: false, dietaryTags: [], allergens: [], notes: ''
    });
    loadData();
  };

  const handleEditItem = (item: CatalogItem) => {
    setNewItem(item);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (itemToDelete?.id) {
      await deleteCatalogItem(itemToDelete.id);
      loadData();
      setItemToDelete(null);
    }
  };

  const toggleFavorite = async (item: CatalogItem) => {
    try {
      const updatedItem = { ...item, isFavorite: !item.isFavorite };
      await saveCatalogItem(updatedItem);
      setItems(items.map(i => i.id === item.id ? updatedItem : i));
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const toggleTag = (type: 'dietaryTags' | 'allergens', tag: string) => {
    const currentTags = newItem[type] || [];
    if (currentTags.includes(tag)) {
      setNewItem({ ...newItem, [type]: currentTags.filter(t => t !== tag) });
    } else {
      setNewItem({ ...newItem, [type]: [...currentTags, tag] });
    }
  };

  const dietaryOptions = ['Vegan', 'Vegetarian', 'Halal', 'Kosher', 'Gluten-Free', 'Dairy-Free', 'Nut-Free'];
  const allergenOptions = ['Dairy', 'Gluten', 'Nuts', 'Eggs', 'Fish', 'Shellfish', 'Soy', 'Sesame', 'Sulfites'];

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Food Catalog</h1>
          <p className="text-slate-500 text-sm">{items.length} items across 5 categories</p>
        </div>
        <button onClick={() => {
          setNewItem({ type: 'food', name: '', category: '', subcategory: '', unit: 'portion', defaultQty: 1, isFavorite: false, dietaryTags: [], allergens: [], notes: '' });
          setIsModalOpen(true);
        }} className="w-full sm:w-auto bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-800 flex items-center justify-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <input 
            type="text" 
            placeholder="Search items..." 
            className="w-full sm:flex-1 sm:max-w-md border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
          <div className="flex flex-wrap gap-2">
            {['All', 'Appetizers', 'Desserts', 'Main Course', 'Salads', 'Soups'].map(cat => (
              <button key={cat} className={`px-3 py-1.5 text-[10px] sm:text-xs font-medium rounded-md ${cat === 'All' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>
        
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading...</div>
          ) : items.map(item => (
            <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50 gap-4">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <button 
                  onClick={() => toggleFavorite(item)}
                  className={`p-1 rounded-full shrink-0 ${item.isFavorite ? 'text-orange-400' : 'text-slate-300 hover:text-slate-400'}`}
                >
                  <Star className="w-5 h-5" fill={item.isFavorite ? "currentColor" : "none"} />
                </button>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-slate-900 text-sm sm:text-base truncate">{item.name}</h3>
                    <div className="flex flex-wrap gap-1">
                      {item.dietaryTags?.slice(0, 2).map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[8px] sm:text-[10px] border border-slate-200 whitespace-nowrap">{tag}</span>
                      ))}
                      {item.dietaryTags && item.dietaryTags.length > 2 && (
                        <span className="text-[8px] sm:text-[10px] text-slate-400">+{item.dietaryTags.length - 2}</span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500">{item.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-slate-500 shrink-0">
                <span className="hidden sm:inline">{item.defaultQty} {item.unit}</span>
                <button onClick={() => handleEditItem(item)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => setItemToDelete(item)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && !loading && (
            <div className="p-8 text-center text-slate-500">No food items found.</div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-none sm:rounded-lg shadow-xl w-full max-w-xl h-full sm:h-auto sm:max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white z-10 shrink-0">
              <h2 className="text-lg font-bold text-slate-900">{newItem.id ? 'Edit Food Item' : 'Add Food Item'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Item Name *</label>
                <input type="text" value={newItem.name || ''} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full border border-slate-300 rounded-md p-2 text-sm" placeholder="Smoked Salmon Canapés" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                  <select value={newItem.category || ''} onChange={e => setNewItem({...newItem, category: e.target.value})} className="w-full border border-slate-300 rounded-md p-2 text-sm">
                    <option value="">Select...</option>
                    <option value="Appetizers">Appetizers</option>
                    <option value="Desserts">Desserts</option>
                    <option value="Main Course">Main Course</option>
                    <option value="Salads">Salads</option>
                    <option value="Soups">Soups</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Subcategory</label>
                  <input type="text" value={newItem.subcategory || ''} onChange={e => setNewItem({...newItem, subcategory: e.target.value})} className="w-full border border-slate-300 rounded-md p-2 text-sm" placeholder="Optional" />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
                  <select value={newItem.unit || 'portion'} onChange={e => setNewItem({...newItem, unit: e.target.value})} className="w-full border border-slate-300 rounded-md p-2 text-sm">
                    <option value="portion">portion</option>
                    <option value="piece">piece</option>
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Default Qty</label>
                  <input type="number" min="1" value={newItem.defaultQty || 1} onChange={e => setNewItem({...newItem, defaultQty: parseInt(e.target.value) || 1})} className="w-full border border-slate-300 rounded-md p-2 text-sm" />
                </div>
                <div className="pb-2 col-span-2 sm:col-span-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={!!newItem.isFavorite} onChange={e => setNewItem({...newItem, isFavorite: e.target.checked})} className="rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
                    <span className="text-sm font-medium text-slate-700">Favorite</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Dietary Tags</label>
                <div className="flex flex-wrap gap-2">
                  {dietaryOptions.map(tag => (
                    <button 
                      key={tag} 
                      onClick={() => toggleTag('dietaryTags', tag)}
                      className={`px-3 py-1 text-[10px] sm:text-xs rounded-full border ${newItem.dietaryTags?.includes(tag) ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Allergens</label>
                <div className="flex flex-wrap gap-2">
                  {allergenOptions.map(tag => (
                    <button 
                      key={tag} 
                      onClick={() => toggleTag('allergens', tag)}
                      className={`px-3 py-1 text-[10px] sm:text-xs rounded-full border ${newItem.allergens?.includes(tag) ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea value={newItem.notes || ''} onChange={e => setNewItem({...newItem, notes: e.target.value})} className="w-full border border-slate-300 rounded-md p-2 text-sm h-24" placeholder="Any additional notes..."></textarea>
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row justify-end gap-3 bg-slate-50 shrink-0">
              <button onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-md text-sm font-medium">Cancel</button>
              <button onClick={handleAddItem} className="w-full sm:w-auto px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 text-sm font-medium">{newItem.id ? 'Save Changes' : 'Add Item'}</button>
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
