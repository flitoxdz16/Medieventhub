import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

interface Permission {
  id: number;
  name: string;
  description: string;
}

interface PermissionGroup {
  groupName: string;
  permissions: Permission[];
}

interface RolePermissionsProps {
  userId: number;
  userRole: string;
}

const RolePermissions: React.FC<RolePermissionsProps> = ({ userId, userRole }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [userPermissions, setUserPermissions] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Fetch all available permissions and user's permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        setIsLoading(true);
        // Fetch all permissions
        const allPermissionsRes = await fetch("/api/permissions", {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("authToken")}`
          }
        });
        
        if (!allPermissionsRes.ok) {
          throw new Error("Failed to fetch permissions");
        }
        
        const allPermissions = await allPermissionsRes.json();
        setPermissions(allPermissions);
        
        // Fetch user's permissions
        const userPermissionsRes = await fetch(`/api/users/${userId}/permissions`, {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("authToken")}`
          }
        });
        
        if (!userPermissionsRes.ok) {
          throw new Error("Failed to fetch user permissions");
        }
        
        const userPerms = await userPermissionsRes.json();
        setUserPermissions(userPerms.map((p: Permission) => p.id));
      } catch (error) {
        console.error("Error fetching permissions:", error);
        toast({
          title: t("common.error"),
          description: t("permissions.errorFetching"),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPermissions();
  }, [userId, toast, t]);
  
  // Group permissions by category
  const groupedPermissions = React.useMemo(() => {
    if (!permissions.length) return [];
    
    const groups: Record<string, Permission[]> = {};
    
    permissions.forEach(permission => {
      const [resource] = permission.name.split(":");
      if (!groups[resource]) {
        groups[resource] = [];
      }
      groups[resource].push(permission);
    });
    
    return Object.entries(groups).map(([groupName, permissions]) => ({
      groupName,
      permissions,
    }));
  }, [permissions]);
  
  // Handle permission toggle
  const handlePermissionToggle = (permissionId: number) => {
    setUserPermissions(prev => {
      if (prev.includes(permissionId)) {
        return prev.filter(id => id !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
  };
  
  // Handle save permissions
  const handleSavePermissions = async () => {
    try {
      setIsSaving(true);
      const response = await apiRequest("PUT", `/api/users/${userId}/permissions`, {
        permissionIds: userPermissions,
      });
      
      if (!response.ok) {
        throw new Error("Failed to update permissions");
      }
      
      toast({
        title: t("permissions.updateSuccess"),
        description: t("permissions.updateSuccessMessage"),
      });
    } catch (error) {
      console.error("Error updating permissions:", error);
      toast({
        title: t("common.error"),
        description: t("permissions.errorUpdating"),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Select all permissions in a group
  const selectAllInGroup = (groupName: string) => {
    const groupPermissions = permissions.filter(p => p.name.startsWith(`${groupName}:`));
    const groupPermissionIds = groupPermissions.map(p => p.id);
    
    setUserPermissions(prev => {
      const withoutGroup = prev.filter(id => 
        !groupPermissions.some(p => p.id === id)
      );
      return [...withoutGroup, ...groupPermissionIds];
    });
  };
  
  // Deselect all permissions in a group
  const deselectAllInGroup = (groupName: string) => {
    const groupPermissions = permissions.filter(p => p.name.startsWith(`${groupName}:`));
    const groupPermissionIds = groupPermissions.map(p => p.id);
    
    setUserPermissions(prev => 
      prev.filter(id => !groupPermissionIds.includes(id))
    );
  };
  
  // Check if all permissions in a group are selected
  const areAllSelected = (groupName: string) => {
    const groupPermissions = permissions.filter(p => p.name.startsWith(`${groupName}:`));
    return groupPermissions.every(p => userPermissions.includes(p.id));
  };
  
  // Check if some permissions in a group are selected
  const areSomeSelected = (groupName: string) => {
    const groupPermissions = permissions.filter(p => p.name.startsWith(`${groupName}:`));
    return groupPermissions.some(p => userPermissions.includes(p.id)) && 
           !groupPermissions.every(p => userPermissions.includes(p.id));
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t("permissions.managePermissions")}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("permissions.roleIs")} {t(`users.roles.${userRole}`)}
          </p>
        </div>
        <Button
          onClick={handleSavePermissions}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("common.saving")}
            </>
          ) : (
            t("permissions.savePermissions")
          )}
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-6">
          {groupedPermissions.map((group) => (
            <div key={group.groupName} className="mb-8 last:mb-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium capitalize text-gray-900 dark:text-white">
                  {group.groupName} {t("permissions.permissions")}
                </h3>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => selectAllInGroup(group.groupName)}
                    disabled={areAllSelected(group.groupName)}
                  >
                    {t("permissions.selectAll")}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => deselectAllInGroup(group.groupName)}
                    disabled={!areSomeSelected(group.groupName) && !areAllSelected(group.groupName)}
                  >
                    {t("permissions.deselectAll")}
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.permissions.map((permission) => (
                  <div 
                    key={permission.id} 
                    className="flex items-start space-x-2 p-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <Checkbox
                      id={`permission-${permission.id}`}
                      checked={userPermissions.includes(permission.id)}
                      onCheckedChange={() => handlePermissionToggle(permission.id)}
                    />
                    <div className="space-y-1">
                      <Label 
                        htmlFor={`permission-${permission.id}`}
                        className="font-medium"
                      >
                        {permission.name}
                      </Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {permission.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Separator className="mt-6" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default RolePermissions;
