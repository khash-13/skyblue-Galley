import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { motion } from 'motion/react';

const Logo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M55 25 H 40 L 15 50 L 40 75 H 55 L 30 50 Z" fill="#1868A5" />
    <path d="M85 25 H 70 L 45 50 L 70 75 H 85 L 60 50 Z" fill="#F27C22" />
  </svg>
);

export default function Login() {
  const { user, login } = useAuth();

  if (user) return <Navigate to="/" />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-[#1868A5]/10"
          >
            <Logo className="h-10 w-10" />
          </motion.div>
          <motion.h2 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
            className="mt-6 text-center text-3xl font-extrabold text-gray-900"
          >
            Sign in to SKYBLUE GALLEY
          </motion.h2>
          <motion.p 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
            className="mt-2 text-center text-sm text-gray-600"
          >
            Manage catering and grocery orders for your flights.
          </motion.p>
        </div>
        <div className="mt-8 space-y-6">
          <button
            onClick={login}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
}
