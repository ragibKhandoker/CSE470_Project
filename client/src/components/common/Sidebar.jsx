import React from 'react';
import { NavLink } from 'react-router-dom';

/**
 * Role-Based Dashboard Sidebar Navigation Component
 */
export const Sidebar = ({ links = [] }) => {
  // TODO: Add collapsed sidebar state and active link indicator
  return (
    <aside className="w-64 bg-slate-900 text-slate-200 min-h-screen p-4 flex flex-col">
      <div className="text-xl font-bold text-emerald-400 p-3 mb-6 border-b border-slate-800">
        ShareMeal Dashboard
      </div>
      <nav className="flex-1 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-lg font-medium transition-colors ${
                isActive ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800 text-slate-300'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
