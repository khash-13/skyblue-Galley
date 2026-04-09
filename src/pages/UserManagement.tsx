import React, { useEffect, useState } from 'react';
import { getUsers, AppUser, saveUser, deleteUser } from '../services/db';
import { Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AppUser | null>(null);
  const [newUser, setNewUser] = useState<Partial<AppUser>>({ role: 'crew', status: 'Active' });

  const loadUsers = () => {
    setLoading(true);
    getUsers().then(data => {
      setUsers(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email) return;
    await saveUser(newUser);
    setIsModalOpen(false);
    setNewUser({ role: 'crew', status: 'Active' });
    loadUsers();
  };

  const handleDeleteClick = (user: AppUser) => {
    setUserToDelete(user);
  };

  const confirmDelete = async () => {
    if (userToDelete?.uid) {
      await deleteUser(userToDelete.uid);
      loadUsers();
      setUserToDelete(null);
    }
  };

  const stats = {
    directors: users.filter(u => u.role === 'director').length,
    crew: users.filter(u => u.role === 'crew').length,
    pilots: users.filter(u => u.role === 'pilot').length,
    admins: users.filter(u => u.role === 'admin').length,
  };

  if (currentUser?.role !== 'admin') {
    return <div className="p-8 text-red-500">Access Denied. Admins only.</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500">{users.length} users • Manage roles & permissions for approvals</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-800 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-bold">D</div>
          <div><p className="text-2xl font-bold text-slate-900">{stats.directors}</p><p className="text-xs text-slate-500 uppercase">Directors</p></div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 font-bold">C</div>
          <div><p className="text-2xl font-bold text-slate-900">{stats.crew}</p><p className="text-xs text-slate-500 uppercase">Cabin Crews</p></div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold">P</div>
          <div><p className="text-2xl font-bold text-slate-900">{stats.pilots}</p><p className="text-xs text-slate-500 uppercase">Pilots</p></div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-red-600 font-bold">A</div>
          <div><p className="text-2xl font-bold text-slate-900">{stats.admins}</p><p className="text-xs text-slate-500 uppercase">Admins</p></div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="p-4 border-b border-slate-200">
          <h2 className="font-medium text-slate-900">All Users</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading...</div>
          ) : users.map(user => (
            <div key={user.uid} className="p-4 flex items-center justify-between hover:bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
                  {user.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h3 className="font-medium text-slate-900">{user.name}</h3>
                  <p className="text-sm text-slate-500">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium capitalize">{user.role}</span>
                <span className="px-3 py-1 bg-slate-900 text-white rounded-full text-xs font-medium">{user.status || 'Active'}</span>
                <button className="text-sm text-slate-500 hover:text-slate-700">Deactivate</button>
                <button onClick={() => handleDeleteClick(user)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h2 className="font-medium text-slate-900 mb-4">Role Permissions</h2>
        <div className="grid grid-cols-2 gap-8">
          <div>
            <span className="px-3 py-1 bg-slate-900 text-white rounded-full text-xs font-medium mb-3 inline-block">Director</span>
            <ul className="text-sm text-slate-600 space-y-2 list-disc list-inside">
              <li>Approve/reject orders</li>
              <li>View all flights & orders</li>
              <li>Manage users</li>
              <li>Override any action</li>
            </ul>
          </div>
          <div>
            <span className="px-3 py-1 bg-orange-500 text-white rounded-full text-xs font-medium mb-3 inline-block">Cabin Crew</span>
            <ul className="text-sm text-slate-600 space-y-2 list-disc list-inside">
              <li>Create/edit flights</li>
              <li>Build orders (draft)</li>
              <li>Submit for approval</li>
              <li>Upload bills</li>
            </ul>
          </div>
          <div>
            <span className="px-3 py-1 bg-slate-200 text-slate-700 rounded-full text-xs font-medium mb-3 inline-block">Pilot</span>
            <ul className="text-sm text-slate-600 space-y-2 list-disc list-inside">
              <li>View flights & orders</li>
              <li>Approve/reject orders</li>
              <li>View delivery status</li>
            </ul>
          </div>
          <div>
            <span className="px-3 py-1 bg-red-500 text-white rounded-full text-xs font-medium mb-3 inline-block">Admin</span>
            <ul className="text-sm text-slate-600 space-y-2 list-disc list-inside">
              <li>Full system access</li>
              <li>Manage vendors & catalogs</li>
              <li>Manage users & roles</li>
              <li>Override approvals</li>
            </ul>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="font-medium text-slate-900">Add New User</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                <input type="text" value={newUser.name || ''} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full border border-slate-300 rounded-md p-2" placeholder="Captain Raj Malhotra" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input type="email" value={newUser.email || ''} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full border border-slate-300 rounded-md p-2" placeholder="raj@jetgalley.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select value={newUser.role || 'crew'} onChange={e => setNewUser({...newUser, role: e.target.value as any})} className="w-full border border-slate-300 rounded-md p-2">
                  <option value="crew">Cabin Crew</option>
                  <option value="pilot">Pilot</option>
                  <option value="director">Director</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-md">Cancel</button>
              <button onClick={handleAddUser} className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800">Add User</button>
            </div>
          </div>
        </div>
      )}

      {userToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="font-medium text-slate-900">Confirm Deletion</h2>
              <button onClick={() => setUserToDelete(null)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            <div className="p-6">
              <p className="text-slate-600">Are you sure you want to delete the user <strong>{userToDelete.name}</strong>?</p>
              <p className="text-sm text-slate-500 mt-2">This action cannot be undone.</p>
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
              <button onClick={() => setUserToDelete(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-md">Cancel</button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Delete User</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
