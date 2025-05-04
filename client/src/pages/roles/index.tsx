import React from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { 
  Shield, 
  CheckCircle, 
  XCircle 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";

const RolesPage = () => {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const { toast } = useToast();
  
  // Fetch permissions
  const { data: permissions, isLoading: isLoadingPermissions } = useQuery({
    queryKey: ['/api/permissions'],
  });
  
  // Fetch roles (this would come from a real API in a complete implementation)
  const roles = [
    { id: 1, name: "super_admin", displayName: t("users.roles.super_admin"), description: t("roles.descriptions.super_admin") },
    { id: 2, name: "ministry_manager", displayName: t("users.roles.ministry_manager"), description: t("roles.descriptions.ministry_manager") },
    { id: 3, name: "province_manager", displayName: t("users.roles.province_manager"), description: t("roles.descriptions.province_manager") },
    { id: 4, name: "hospital_manager", displayName: t("users.roles.hospital_manager"), description: t("roles.descriptions.hospital_manager") },
    { id: 5, name: "lecturer_doctor", displayName: t("users.roles.lecturer_doctor"), description: t("roles.descriptions.lecturer_doctor") },
    { id: 6, name: "participant_doctor", displayName: t("users.roles.participant_doctor"), description: t("roles.descriptions.participant_doctor") },
    { id: 7, name: "guest", displayName: t("users.roles.guest"), description: t("roles.descriptions.guest") },
  ];
  
  // Group permissions by category
  const groupedPermissions = React.useMemo(() => {
    if (!permissions) return [];
    
    const groups: Record<string, any[]> = {};
    
    permissions.forEach((permission: any) => {
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
  
  // Mock role permissions (this would come from a real API)
  const rolePermissions = {
    "super_admin": ["*"], // All permissions
    "ministry_manager": [
      "user:create", "user:read", "user:update",
      "event:create", "event:read", "event:update", "event:delete", "event:publish", "event:approve",
      "certificate:generate", "certificate:read", "certificate:revoke",
      "media:upload", "media:read", "media:delete",
      "report:generate", 
      "log:view"
    ],
    "province_manager": [
      "user:read",
      "event:create", "event:read", "event:update", "event:publish", "event:approve",
      "certificate:generate", "certificate:read",
      "media:upload", "media:read",
      "report:generate"
    ],
    "hospital_manager": [
      "user:read",
      "event:create", "event:read", "event:update", "event:publish",
      "certificate:generate", "certificate:read",
      "media:upload", "media:read"
    ],
    "lecturer_doctor": [
      "event:read", "event:create", "event:update",
      "certificate:generate", "certificate:read",
      "media:upload", "media:read"
    ],
    "participant_doctor": [
      "event:read", "event:register",
      "certificate:read"
    ],
    "guest": [
      "event:read"
    ]
  };
  
  // Check if a role has a permission
  const hasPermission = (roleName: string, permissionName: string) => {
    if (roleName === "super_admin") return true; // Super admin has all permissions
    return rolePermissions[roleName as keyof typeof rolePermissions].includes(permissionName);
  };
  
  // Not implemented for this demo - would save role permissions changes
  const handleSaveChanges = () => {
    toast({
      title: t("roles.saveSuccess"),
      description: t("roles.saveSuccessMessage"),
    });
  };
  
  if (isLoadingPermissions) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t("roles.managementTitle")}</h1>
        </div>
        <div className="mt-6">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t("roles.managementTitle")}</h1>
        {can("role:manage") && (
          <div className="mt-3 sm:mt-0 sm:ml-4">
            <Button onClick={handleSaveChanges}>
              {t("roles.saveChanges")}
            </Button>
          </div>
        )}
      </div>
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2 text-primary-500" />
            {t("roles.rolePermissionsMatrix")}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-40">{t("roles.permission")}</TableHead>
                  {roles.map((role) => (
                    <TableHead key={role.id} className="text-center">
                      <div className="font-medium">{role.displayName}</div>
                      <div className="text-xs font-normal text-gray-500 dark:text-gray-400 mt-1 max-w-[120px] mx-auto">
                        {role.description}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedPermissions.map((group) => (
                  <React.Fragment key={group.groupName}>
                    <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                      <TableCell colSpan={roles.length + 1} className="font-medium capitalize">
                        {group.groupName} {t("permissions.permissions")}
                      </TableCell>
                    </TableRow>
                    {group.permissions.map((permission: any) => (
                      <TableRow key={permission.id}>
                        <TableCell className="font-mono text-xs">
                          <div className="flex items-center">
                            <span className="font-medium">{permission.name}</span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-[200px]">
                            {permission.description}
                          </div>
                        </TableCell>
                        {roles.map((role) => (
                          <TableCell key={`${role.id}-${permission.id}`} className="text-center">
                            {can("role:manage") ? (
                              <Checkbox
                                checked={hasPermission(role.name, permission.name)}
                                disabled={role.name === "super_admin"} // Super admin always has all permissions
                                // In a real implementation, this would update the permissions
                                // onCheckedChange={(checked) => handlePermissionChange(role.name, permission.name, checked)}
                              />
                            ) : (
                              hasPermission(role.name, permission.name) ? (
                                <CheckCircle className="h-5 w-5 mx-auto text-green-500" />
                              ) : (
                                <XCircle className="h-5 w-5 mx-auto text-gray-300 dark:text-gray-600" />
                              )
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm text-gray-500 dark:text-gray-400">
        <p>{t("roles.permissionsDescription")}</p>
        {can("role:manage") && (
          <Button
            onClick={handleSaveChanges}
            className="mt-4 sm:mt-0"
          >
            {t("roles.saveChanges")}
          </Button>
        )}
      </div>
    </div>
  );
};

export default RolesPage;
