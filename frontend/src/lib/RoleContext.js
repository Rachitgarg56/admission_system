'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const RoleContext = createContext();

export function RoleProvider({ children }) {
  const [role, setRole] = useState('Admission Officer');

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('user-role');
    if (saved) setRole(saved);
  }, []);

  // Save to localStorage when changed
  const updateRole = (newRole) => {
    setRole(newRole);
    localStorage.setItem('user-role', newRole);
  };

  return (
    <RoleContext.Provider value={{ role, setRole: updateRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
