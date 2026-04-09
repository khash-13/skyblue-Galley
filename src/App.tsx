import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LayoutDashboard, Plane, Utensils, ShoppingBasket, Store, CheckSquare, Package, Users, Settings as SettingsIcon, LogOut, PanelLeftClose, PanelLeftOpen, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Pages
import Dashboard from './pages/Dashboard';
import Flights from './pages/Flights';
import FlightOrderBuilder from './pages/FlightOrderBuilder';
import Vendors from './pages/Vendors';
import VendorImport from './pages/VendorImport';
import VendorMenu from './pages/VendorMenu';
import Approvals from './pages/Approvals';
import Login from './pages/Login';
import FoodCatalog from './pages/FoodCatalog';
import GroceryCatalog from './pages/GroceryCatalog';
import UserManagement from './pages/UserManagement';
import Settings from './pages/Settings';
import OrderTracking from './pages/OrderTracking';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
};

const NavItem = ({ to, icon: Icon, label, isCollapsed }: { to: string, icon: any, label: string, isCollapsed: boolean }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
  
  return (
    <Link 
      to={to} 
      className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
        isActive ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
      }`}
      title={isCollapsed ? label : undefined}
    >
      <Icon className="w-5 h-5 shrink-0" />
      {!isCollapsed && <span className="text-sm font-medium">{label}</span>}
    </Link>
  );
};

const Logo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M55 25 H 40 L 15 50 L 40 75 H 55 L 30 50 Z" fill="white" />
    <path d="M85 25 H 70 L 45 50 L 70 75 H 85 L 60 50 Z" fill="#F27C22" />
  </svg>
);

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile menu when route changes
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);
  
  const SidebarContent = () => (
    <>
      <div className="p-4 flex items-center justify-between border-b border-white/10 h-16 shrink-0">
        <div className="flex items-center gap-2">
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Logo className="w-8 h-8 shrink-0" />
          </motion.div>
          {(!isCollapsed || isMobileMenuOpen) && (
            <motion.span 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
              className="text-xl font-bold tracking-tight whitespace-nowrap"
            >
              SKYBLUE GALLEY
            </motion.span>
          )}
        </div>
        {isMobileMenuOpen && (
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden p-2 text-white/70 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        <div>
          {(!isCollapsed || isMobileMenuOpen) && <p className="px-3 text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Navigation</p>}
          <nav className="space-y-1">
            <NavItem to="/" icon={LayoutDashboard} label="Dashboard" isCollapsed={isCollapsed && !isMobileMenuOpen} />
            <NavItem to="/flights" icon={Plane} label="Flights" isCollapsed={isCollapsed && !isMobileMenuOpen} />
            <NavItem to="/catalog/food" icon={Utensils} label="Food Catalog" isCollapsed={isCollapsed && !isMobileMenuOpen} />
            <NavItem to="/catalog/grocery" icon={ShoppingBasket} label="Grocery Catalog" isCollapsed={isCollapsed && !isMobileMenuOpen} />
            <NavItem to="/vendors" icon={Store} label="Vendors" isCollapsed={isCollapsed && !isMobileMenuOpen} />
          </nav>
        </div>
        
        <div>
          {(!isCollapsed || isMobileMenuOpen) && <p className="px-3 text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Workflow</p>}
          <nav className="space-y-1">
            <NavItem to="/approvals" icon={CheckSquare} label="Approvals" isCollapsed={isCollapsed && !isMobileMenuOpen} />
            <NavItem to="/tracking" icon={Package} label="Order Tracking" isCollapsed={isCollapsed && !isMobileMenuOpen} />
            <NavItem to="/users" icon={Users} label="User Management" isCollapsed={isCollapsed && !isMobileMenuOpen} />
            <NavItem to="/settings" icon={SettingsIcon} label="Settings" isCollapsed={isCollapsed && !isMobileMenuOpen} />
          </nav>
        </div>
      </div>
      
      <div className="p-4 border-t border-white/10">
        {(!isCollapsed || isMobileMenuOpen) && (
          <div className="mb-4">
            <p className="text-sm font-medium text-white">{user?.name}</p>
            <p className="text-xs text-white/50 capitalize">{user?.role}</p>
          </div>
        )}
        <button onClick={logout} className={`flex items-center gap-2 text-sm text-white/70 hover:text-white w-full ${(isCollapsed && !isMobileMenuOpen) ? 'justify-center' : ''}`} title="Sign Out">
          <LogOut className="w-5 h-5 shrink-0" />
          {(!isCollapsed || isMobileMenuOpen) && <span>Sign Out</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-72 bg-[#1868A5] text-white z-50 flex flex-col lg:hidden"
          >
            <SidebarContent />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex bg-[#1868A5] text-white flex-col transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} overflow-hidden shrink-0`}>
        <SidebarContent />
      </aside>
      
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0 z-30">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsMobileMenuOpen(true)} 
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-md"
            >
              <Menu className="w-6 h-6" />
            </button>
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)} 
              className="hidden lg:block p-2 text-slate-500 hover:bg-slate-100 rounded-md"
            >
              {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            </button>
            <div className="lg:hidden flex items-center gap-2">
              <Logo className="w-6 h-6" />
              <span className="text-sm font-bold text-[#1868A5] truncate max-w-[120px]">SKYBLUE GALLEY</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#1868A5]/10 flex items-center justify-center text-[#1868A5] font-bold shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/flights" element={<ProtectedRoute><Layout><Flights /></Layout></ProtectedRoute>} />
          <Route path="/flights/new" element={<ProtectedRoute><Layout><FlightOrderBuilder /></Layout></ProtectedRoute>} />
          <Route path="/flights/:id" element={<ProtectedRoute><Layout><FlightOrderBuilder /></Layout></ProtectedRoute>} />
          <Route path="/catalog/food" element={<ProtectedRoute><Layout><FoodCatalog /></Layout></ProtectedRoute>} />
          <Route path="/catalog/grocery" element={<ProtectedRoute><Layout><GroceryCatalog /></Layout></ProtectedRoute>} />
          <Route path="/vendors" element={<ProtectedRoute><Layout><Vendors /></Layout></ProtectedRoute>} />
          <Route path="/vendors/:id/menu" element={<ProtectedRoute><Layout><VendorMenu /></Layout></ProtectedRoute>} />
          <Route path="/vendors/:id/import" element={<ProtectedRoute><Layout><VendorImport /></Layout></ProtectedRoute>} />
          <Route path="/approvals" element={<ProtectedRoute><Layout><Approvals /></Layout></ProtectedRoute>} />
          <Route path="/tracking" element={<ProtectedRoute><Layout><OrderTracking /></Layout></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute><Layout><UserManagement /></Layout></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
