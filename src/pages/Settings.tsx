import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Settings() {
  const { user } = useAuth();

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500">Manage your organization settings.</p>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-medium text-slate-900">Profile</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm text-slate-500">Name</span>
              <span className="text-sm font-medium text-slate-900">{user?.name}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm text-slate-500">Email</span>
              <span className="text-sm font-medium text-slate-900">{user?.email}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-slate-500">Role</span>
              <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium capitalize">{user?.role}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-medium text-slate-900">Categories</h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-slate-500">Category management will be available when the backend is connected.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
