import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export const seedData = async () => {
  console.log("Starting seed...");
  
  // Check if vendors exist
  const vendorsSnap = await getDocs(collection(db, 'vendors'));
  if (!vendorsSnap.empty) {
    console.log("Data already seeded.");
    return;
  }

  // Add Vendors
  const v1 = await addDoc(collection(db, 'vendors'), {
    name: 'SkyHigh Catering', contactPerson: 'Alice Smith', phone: '+1 555-0101', email: 'orders@skyhigh.com', address: '123 Airport Rd', notes: 'Requires 24h notice', currency: 'USD', createdAt: new Date().toISOString()
  });
  const v2 = await addDoc(collection(db, 'vendors'), {
    name: 'The Ritz-Carlton Inflight', contactPerson: 'Bob Jones', phone: '+1 555-0202', email: 'inflight@ritz.com', address: '456 Luxury Ave', notes: 'Premium service', currency: 'USD', createdAt: new Date().toISOString()
  });

  // Add Vendor Menu Items
  const menuItems = [
    { vendorId: v1.id, name: 'Continental Breakfast Box', description: 'Croissant, fruit, yogurt.', price: 25, currency: 'USD', category: 'Breakfast', dietaryTags: ['Vegetarian'], allergens: ['Dairy', 'Gluten'] },
    { vendorId: v1.id, name: 'Grilled Salmon', description: 'With asparagus and quinoa.', price: 45, currency: 'USD', category: 'Mains', dietaryTags: ['Pescatarian'], allergens: ['Fish'] },
    { vendorId: v2.id, name: 'Wagyu Beef Tenderloin', description: 'Truffle mash, seasonal veg.', price: 120, currency: 'USD', category: 'Mains', dietaryTags: [], allergens: ['Dairy'] },
    { vendorId: v2.id, name: 'Vegan Buddha Bowl', description: 'Quinoa, roasted sweet potato, tahini.', price: 35, currency: 'USD', category: 'Mains', dietaryTags: ['Vegan', 'Gluten-Free'], allergens: ['Sesame'] }
  ];

  for (const item of menuItems) {
    await addDoc(collection(db, 'vendorMenuItems'), { ...item, createdAt: new Date().toISOString() });
  }

  // Add Catalog Items
  const catalogItems = [
    { name: 'Sparkling Water (San Pellegrino)', type: 'grocery', category: 'Beverages', unit: 'Bottle (750ml)', dietaryTags: [], allergens: [], defaultQty: 6, isFavorite: true },
    { name: 'Fresh Lemons', type: 'grocery', category: 'Produce', unit: 'Each', dietaryTags: ['Vegan'], allergens: [], defaultQty: 4, isFavorite: true },
    { name: 'Mixed Nuts', type: 'grocery', category: 'Snacks', unit: 'Jar', dietaryTags: ['Vegan'], allergens: ['Tree Nuts'], defaultQty: 2, isFavorite: false }
  ];

  for (const item of catalogItems) {
    await addDoc(collection(db, 'catalogItems'), { ...item, createdAt: new Date().toISOString() });
  }

  console.log("Seed complete.");
};
