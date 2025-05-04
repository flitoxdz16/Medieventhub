import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { User } from "@shared/schema";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePermissions } from "@/hooks/usePermissions";

// User form schema
const userSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters" }),
  role: z.enum(["super_admin", "ministry_manager", "province_manager", "hospital_manager", "lecturer_doctor", "participant_doctor", "guest"]),
  organization: z.string().optional(),
  position: z.string().optional(),
  profileImage: z.string().optional(),
  preferredLanguage: z.enum(["en", "fr", "ar"]).default("en"),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }).optional(),
  confirmPassword: z.string().optional(),
}).refine(data => !data.password || data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormProps {
  initialData?: Partial<User>;
  onSubmit: (data: UserFormData) => void;
  isLoading: boolean;
  mode: "create" | "edit";
}

const UserForm: React.FC<UserFormProps> = ({
  initialData,
  onSubmit,
  isLoading,
  mode,
}) => {
  const { t } = useTranslation();
  const { can } = usePermissions();
  
  // Default values for the form
  const defaultValues: Partial<UserFormData> = {
    username: "",
    email: "",
    fullName: "",
    role: "guest",
    organization: "",
    position: "",
    profileImage: "",
    preferredLanguage: "en",
    ...initialData,
  };
  
  // Form instance
  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues,
  });
  
  // Handle form submission
  const handleSubmit = (data: UserFormData) => {
    // If editing and password is empty, remove it from the submission
    if (mode === "edit" && !data.password) {
      const { password, confirmPassword, ...restData } = data;
      onSubmit(restData);
    } else {
      onSubmit(data);
    }
  };
  
  // Get selected role from form
  const selectedRole = form.watch("role");
  
  // Check if current user can change roles
  const canManageRoles = can("role:manage");
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <div className="flex items-center mb-8">
          <div className="mr-4">
            <FormField
              control={form.control}
              name="profileImage"
              render={({ field }) => (
                <FormItem>
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={field.value || undefined} alt={form.watch("fullName")} />
                    <AvatarFallback className="text-lg">
                      {form.watch("fullName").split(" ").map(n => n[0]).join("").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="mt-2">
                    <FormControl>
                      <Input 
                        placeholder={t("users.profileImageUrl")}
                        {...field} 
                        className="text-xs p-1 h-auto"
                      />
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          </div>
          <div>
            <h2 className="text-xl font-semibold">
              {mode === "create" ? t("users.createNewUser") : t("users.editUserProfile")}
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              {mode === "create" 
                ? t("users.fillDetailsForNewUser")
                : t("users.updateUserDetails")
              }
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("users.fullName")}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("users.username")}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("users.email")}</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("users.role")}</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  disabled={!canManageRoles && mode === "edit"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("users.selectRole")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="super_admin">{t("users.roles.super_admin")}</SelectItem>
                    <SelectItem value="ministry_manager">{t("users.roles.ministry_manager")}</SelectItem>
                    <SelectItem value="province_manager">{t("users.roles.province_manager")}</SelectItem>
                    <SelectItem value="hospital_manager">{t("users.roles.hospital_manager")}</SelectItem>
                    <SelectItem value="lecturer_doctor">{t("users.roles.lecturer_doctor")}</SelectItem>
                    <SelectItem value="participant_doctor">{t("users.roles.participant_doctor")}</SelectItem>
                    <SelectItem value="guest">{t("users.roles.guest")}</SelectItem>
                  </SelectContent>
                </Select>
                {!canManageRoles && mode === "edit" && (
                  <FormDescription>
                    {t("users.roleChangeRestricted")}
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="organization"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("users.organization")}</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("users.position")}</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="preferredLanguage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("users.preferredLanguage")}</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("users.selectLanguage")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="en">{t("languages.english")}</SelectItem>
                    <SelectItem value="fr">{t("languages.french")}</SelectItem>
                    <SelectItem value="ar">{t("languages.arabic")}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {mode === "create" && (
            <>
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("users.password")}</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("users.confirmPassword")}</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
          
          {mode === "edit" && (
            <>
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("users.newPassword")}</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormDescription>
                      {t("users.leaveEmptyToKeep")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("users.confirmNewPassword")}</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
        </div>
        
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            className="mr-2"
            disabled={isLoading}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? t("common.saving") : mode === "create" ? t("users.createUser") : t("users.updateUser")}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default UserForm;
