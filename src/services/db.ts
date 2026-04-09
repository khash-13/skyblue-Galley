import { collection, doc, getDocs, getDoc, setDoc, updateDoc, query, where, orderBy, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface AppUser {
  uid?: string;
  id?: string;
  email: string;
  name: string;
  role: 'admin' | 'crew' | 'approver' | 'director' | 'pilot';
  status?: 'Active' | 'Inactive';
  createdAt?: string;
}

export interface FlightOrder {
  id?: string;
  flightNumber: string;
  tailNumber: string;
  departure: string;
  arrival: string;
  date: string;
  departureTime?: string;
  timezone?: string;
  paxCount: number;
  crewCount: number;
  dietaryNotes: string;
  serviceStyleNotes?: string;
  specialInstructions?: string;
  pickupLocation?: string;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Sent to Vendor' | 'Confirmed' | 'Completed' | 'Rejected';
  vendorId?: string;
  items: OrderItem[];
  createdBy: string;
  approvedBy?: string;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
  billUrl?: string;
  billAmount?: number;
  billNotes?: string;
}

export interface OrderItem {
  itemId: string;
  name: string;
  type: 'food' | 'grocery' | 'vendorMenu' | 'custom';
  category?: string;
  quantity: number;
  notes?: string;
  price?: number;
  unit?: string;
  dietaryTags?: string[];
}

export interface Vendor {
  id?: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  serviceAirports?: string[];
  deliveryOptions?: string[];
  notes: string;
  currency: string;
  taxNotes?: string;
}

export interface VendorMenuItem {
  id?: string;
  vendorId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  dietaryTags: string[];
  allergens: string[];
  catalogItemId?: string;
}

export interface CatalogItem {
  id?: string;
  name: string;
  type: 'food' | 'grocery';
  category: string;
  subcategory?: string;
  unit: string;
  dietaryTags: string[];
  allergens: string[];
  defaultQty: number;
  isFavorite: boolean;
  notes?: string;
}

// Users
export const getUsers = async () => {
  const snapshot = await getDocs(collection(db, 'users'));
  return snapshot.docs.map(doc => ({ id: doc.id, uid: doc.id, ...doc.data() } as AppUser));
};

export const saveUser = async (user: Partial<AppUser>) => {
  if (user.uid) {
    const docRef = doc(db, 'users', user.uid);
    await updateDoc(docRef, { ...user });
  } else {
    // Note: In a real app, you'd create the auth user first via a Cloud Function
    // For this MVP, we just store the profile
    await addDoc(collection(db, 'users'), {
      ...user,
      createdAt: new Date().toISOString()
    });
  }
};

export const deleteUser = async (uid: string) => {
  await deleteDoc(doc(db, 'users', uid));
};

// Flights
export const getFlights = async () => {
  const q = query(collection(db, 'flightOrders'), orderBy('date', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FlightOrder));
};

export const getFlight = async (id: string) => {
  const docRef = doc(db, 'flightOrders', id);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    return { id: snapshot.id, ...snapshot.data() } as FlightOrder;
  }
  return null;
};

export const saveFlight = async (flight: Partial<FlightOrder>) => {
  if (flight.id) {
    const docRef = doc(db, 'flightOrders', flight.id);
    await updateDoc(docRef, { ...flight, updatedAt: new Date().toISOString() });
    return flight.id;
  } else {
    const docRef = await addDoc(collection(db, 'flightOrders'), {
      ...flight,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  }
};

// Vendors
export const getVendors = async () => {
  const snapshot = await getDocs(collection(db, 'vendors'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vendor));
};

export const getVendor = async (id: string) => {
  const docRef = doc(db, 'vendors', id);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    return { id: snapshot.id, ...snapshot.data() } as Vendor;
  }
  return null;
};

export const saveVendor = async (vendor: Partial<Vendor>) => {
  if (vendor.id) {
    const docRef = doc(db, 'vendors', vendor.id);
    await updateDoc(docRef, { ...vendor });
  } else {
    await addDoc(collection(db, 'vendors'), {
      ...vendor,
      createdAt: new Date().toISOString()
    });
  }
};

export const deleteVendor = async (id: string) => {
  await deleteDoc(doc(db, 'vendors', id));
};

export const getVendorMenuItems = async (vendorId: string) => {
  const q = query(collection(db, 'vendorMenuItems'), where('vendorId', '==', vendorId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VendorMenuItem));
};

export const saveVendorMenuItem = async (item: Partial<VendorMenuItem>) => {
  if (item.id) {
    const docRef = doc(db, 'vendorMenuItems', item.id);
    await updateDoc(docRef, { ...item });
  } else {
    await addDoc(collection(db, 'vendorMenuItems'), {
      ...item,
      createdAt: new Date().toISOString()
    });
  }
};

// Catalog
export const getCatalogItems = async (type?: 'food' | 'grocery') => {
  let q = collection(db, 'catalogItems') as any;
  if (type) {
    q = query(q, where('type', '==', type));
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data() as any;
    return { id: doc.id, ...data } as CatalogItem;
  });
};

export const saveCatalogItem = async (item: Partial<CatalogItem>) => {
  if (item.id) {
    const docRef = doc(db, 'catalogItems', item.id);
    await updateDoc(docRef, { ...item });
  } else {
    await addDoc(collection(db, 'catalogItems'), {
      ...item,
      createdAt: new Date().toISOString()
    });
  }
};

export const deleteCatalogItem = async (id: string) => {
  await deleteDoc(doc(db, 'catalogItems', id));
};

export const deleteVendorMenuItem = async (id: string) => {
  await deleteDoc(doc(db, 'vendorMenuItems', id));
};
