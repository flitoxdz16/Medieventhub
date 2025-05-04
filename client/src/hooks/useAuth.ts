import { useContext } from 'react';
import { AuthContext } from '@/providers/AuthProvider';

/**
 * Custom hook for accessing authentication context
 * 
 * @returns Authentication context with user data, auth state, and methods
 */
export function useAuth() {
  const authContext = useContext(AuthContext);
  
  if (!authContext) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return authContext;
}