import { useContext } from 'react';
import { AuthContext } from '@/providers/AuthProvider';

/**
 * A hook to check if the current user has specific permissions
 */
export function usePermissions() {
  const { user } = useContext(AuthContext);
  
  /**
   * Check if the user has a specific permission
   * @param permission The permission to check for (e.g., "user:create")
   * @returns boolean indicating if the user has the permission
   */
  const can = (permission: string): boolean => {
    if (!user) return false;
    
    // Super admin has all permissions
    if (user.role === 'super_admin') return true;
    
    // Check if the user has the specific permission
    return user.permissions.includes(permission);
  };
  
  /**
   * Check if the user has any of the specified permissions
   * @param permissions Array of permissions to check
   * @returns boolean indicating if the user has any of the permissions
   */
  const canAny = (permissions: string[]): boolean => {
    return permissions.some(permission => can(permission));
  };
  
  /**
   * Check if the user has all of the specified permissions
   * @param permissions Array of permissions to check
   * @returns boolean indicating if the user has all of the permissions
   */
  const canAll = (permissions: string[]): boolean => {
    return permissions.every(permission => can(permission));
  };
  
  /**
   * Check if the user has a specific role
   * @param role The role to check for (e.g., "admin")
   * @returns boolean indicating if the user has the role
   */
  const hasRole = (role: string): boolean => {
    if (!user) return false;
    return user.role === role;
  };
  
  /**
   * Check if the user has any of the specified roles
   * @param roles Array of roles to check
   * @returns boolean indicating if the user has any of the roles
   */
  const hasAnyRole = (roles: string[]): boolean => {
    return roles.some(role => hasRole(role));
  };
  
  return { can, canAny, canAll, hasRole, hasAnyRole };
}