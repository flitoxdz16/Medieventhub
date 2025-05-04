import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Check, 
  X,
  UserCog
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePermissions } from "@/hooks/usePermissions";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import UserForm from "@/components/users/UserForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import RolePermissions from "@/components/users/RolePermissions";

const UsersPage = () => {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const { toast } = useToast();
  
  // State for dialogs and forms
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  // Pagination and filter state
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  
  // Fetch users with filtering and pagination
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['/api/users', { page, search }],
  });
  
  // Create user mutation
  const { mutate: createUser, isPending: isCreating } = useMutation({
    mutationFn: async (userData: any) => {
      const response = await apiRequest("POST", "/api/auth/register", userData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("users.createSuccess"),
        description: t("users.createSuccessMessage"),
      });
      // Close dialog
      setIsCreateDialogOpen(false);
      // Invalidate users query cache
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error) => {
      console.error("Error creating user:", error);
      toast({
        title: t("users.createError"),
        description: t("users.createErrorMessage"),
        variant: "destructive",
      });
    },
  });
  
  // Update user mutation
  const { mutate: updateUser, isPending: isUpdating } = useMutation({
    mutationFn: async (userData: any) => {
      const response = await apiRequest("PUT", `/api/users/${selectedUser.id}`, userData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("users.updateSuccess"),
        description: t("users.updateSuccessMessage"),
      });
      // Close dialog
      setIsEditDialogOpen(false);
      // Invalidate users query cache
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error) => {
      console.error("Error updating user:", error);
      toast({
        title: t("users.updateError"),
        description: t("users.updateErrorMessage"),
        variant: "destructive",
      });
    },
  });
  
  // Delete user mutation (not implemented in API, but added for completeness)
  const { mutate: deleteUser, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/users/${selectedUser.id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("users.deleteSuccess"),
        description: t("users.deleteSuccessMessage"),
      });
      // Close dialog
      setIsDeleteDialogOpen(false);
      // Invalidate users query cache
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error) => {
      console.error("Error deleting user:", error);
      toast({
        title: t("users.deleteError"),
        description: t("users.deleteErrorMessage"),
        variant: "destructive",
      });
    },
  });
  
  // Handle search
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPage(1); // Reset to first page when searching
    refetch();
  };
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    refetch();
  };
  
  // Handle edit user
  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };
  
  // Handle delete user
  const handleDeleteUser = (user: any) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };
  
  // Handle manage permissions
  const handleManagePermissions = (user: any) => {
    setSelectedUser(user);
    setIsPermissionsDialogOpen(true);
  };
  
  // Handle form submission for create
  const handleCreateSubmit = (data: any) => {
    createUser(data);
  };
  
  // Handle form submission for edit
  const handleEditSubmit = (data: any) => {
    updateUser(data);
  };
  
  // Get role display name
  const getRoleDisplayName = (role: string) => {
    return t(`users.roles.${role}`);
  };
  
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t("users.managementTitle")}</h1>
        <div className="mt-3 sm:mt-0 sm:ml-4">
          {can("user:create") && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("users.createUser")}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{t("users.createNewUser")}</DialogTitle>
                  <DialogDescription>
                    {t("users.createUserDescription")}
                  </DialogDescription>
                </DialogHeader>
                <div className="max-h-[70vh] overflow-y-auto pr-2">
                  <UserForm
                    onSubmit={handleCreateSubmit}
                    isLoading={isCreating}
                    mode="create"
                  />
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
      
      {/* Filters */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t("users.filterUsers")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <Input
                type="search"
                placeholder={t("users.searchPlaceholder")}
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button type="submit">{t("common.search")}</Button>
          </form>
        </CardContent>
      </Card>
      
      {/* Users Table */}
      <Card className="mt-6">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : data?.users?.length === 0 ? (
            <div className="p-6 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-12 w-12 mx-auto text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{t("users.noUsers")}</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("users.noUsersMessage")}</p>
            </div>
          ) : (
            <div className="relative overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("users.user")}</TableHead>
                    <TableHead>{t("users.email")}</TableHead>
                    <TableHead>{t("users.role")}</TableHead>
                    <TableHead>{t("users.organization")}</TableHead>
                    <TableHead>{t("users.status")}</TableHead>
                    <TableHead className="text-right">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.users.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarImage src={user.profileImage} alt={user.fullName} />
                            <AvatarFallback>
                              {user.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.fullName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {getRoleDisplayName(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.organization || "-"}</TableCell>
                      <TableCell>
                        {user.verified ? (
                          <Badge variant="success" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            <Check className="h-3.5 w-3.5 mr-1" />
                            {t("users.verified")}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                            {t("users.pending")}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                              <span className="sr-only">{t("common.openMenu")}</span>
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                              </svg>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{t("common.actions")}</DropdownMenuLabel>
                            {can("user:update") && (
                              <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                <Edit className="h-4 w-4 mr-2" />
                                {t("users.edit")}
                              </DropdownMenuItem>
                            )}
                            {can("role:manage") && (
                              <DropdownMenuItem onClick={() => handleManagePermissions(user)}>
                                <UserCog className="h-4 w-4 mr-2" />
                                {t("users.managePermissions")}
                              </DropdownMenuItem>
                            )}
                            {can("user:delete") && (
                              <DropdownMenuItem
                                className="text-red-600 dark:text-red-400"
                                onClick={() => handleDeleteUser(user)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {t("users.delete")}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {/* Pagination */}
          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6">
              <div className="hidden sm:block">
                <p className="text-sm text-gray-700 dark:text-gray-400">
                  {t("pagination.showing")} <span className="font-medium">{(data.pagination.page - 1) * data.pagination.limit + 1}</span> {t("pagination.to")}{" "}
                  <span className="font-medium">
                    {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)}
                  </span>{" "}
                  {t("pagination.of")} <span className="font-medium">{data.pagination.total}</span> {t("pagination.results")}
                </p>
              </div>
              <div className="flex-1 flex justify-between sm:justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(data.pagination.page - 1)}
                  disabled={data.pagination.page === 1}
                >
                  {t("pagination.previous")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(data.pagination.page + 1)}
                  disabled={data.pagination.page === data.pagination.totalPages}
                  className="ml-3"
                >
                  {t("pagination.next")}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Edit User Dialog */}
      {selectedUser && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t("users.editUser")}</DialogTitle>
              <DialogDescription>
                {t("users.editUserDescription")}
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[70vh] overflow-y-auto pr-2">
              <UserForm
                initialData={selectedUser}
                onSubmit={handleEditSubmit}
                isLoading={isUpdating}
                mode="edit"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Delete User Dialog */}
      {selectedUser && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t("users.confirmDelete")}</DialogTitle>
              <DialogDescription>
                {t("users.deleteWarning")}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("users.deleteConfirmation", { name: selectedUser.fullName })}
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isDeleting}
              >
                {t("common.cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteUser()}
                disabled={isDeleting}
              >
                {isDeleting ? t("common.processing") : t("users.confirmDelete")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Manage Permissions Dialog */}
      {selectedUser && (
        <Dialog 
          open={isPermissionsDialogOpen} 
          onOpenChange={setIsPermissionsDialogOpen}
        >
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>{t("users.manageUserPermissions")}</DialogTitle>
              <DialogDescription>
                {t("users.permissionsDescription")}
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[70vh] overflow-y-auto pr-2">
              <RolePermissions
                userId={selectedUser.id}
                userRole={selectedUser.role}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default UsersPage;
