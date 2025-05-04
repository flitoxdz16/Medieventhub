import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Event } from "@shared/schema";

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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";

// Event form schema
const eventSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  eventType: z.enum(["conference", "workshop", "seminar", "training", "symposium"]),
  eventLevel: z.enum(["national", "provincial", "local", "hospital", "department"]),
  location: z.string().min(2, { message: "Location is required" }),
  address: z.string().optional(),
  startDate: z.string().min(1, { message: "Start date is required" }),
  endDate: z.string().min(1, { message: "End date is required" }),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  registrationDeadline: z.string().optional(),
  capacity: z.coerce.number().min(1).optional(),
  status: z.enum(["draft", "upcoming", "active", "completed", "cancelled"]),
  coverImage: z.string().optional(),
  autoApproveRegistrations: z.boolean().default(false),
});

type EventFormData = z.infer<typeof eventSchema>;

interface EventFormProps {
  initialData?: Partial<Event>;
  onSubmit: (data: EventFormData) => void;
  isLoading: boolean;
  mode: "create" | "edit";
}

const EventForm: React.FC<EventFormProps> = ({
  initialData,
  onSubmit,
  isLoading,
  mode,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  // Default values for the form
  const defaultValues: Partial<EventFormData> = {
    title: "",
    description: "",
    eventType: "conference",
    eventLevel: "national",
    location: "",
    address: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    endTime: "17:00",
    registrationDeadline: new Date().toISOString().split("T")[0],
    capacity: 100,
    status: "draft",
    coverImage: "",
    autoApproveRegistrations: false,
    ...initialData,
  };
  
  // Format dates from ISO to YYYY-MM-DD
  if (initialData?.startDate) {
    defaultValues.startDate = new Date(initialData.startDate).toISOString().split("T")[0];
  }
  if (initialData?.endDate) {
    defaultValues.endDate = new Date(initialData.endDate).toISOString().split("T")[0];
  }
  if (initialData?.registrationDeadline) {
    defaultValues.registrationDeadline = new Date(initialData.registrationDeadline).toISOString().split("T")[0];
  }
  
  // Form instance
  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues,
  });
  
  // Handle form submission
  const handleSubmit = (data: EventFormData) => {
    onSubmit(data);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <div className="px-4 sm:px-0">
              <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                {t("events.eventInformation")}
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {mode === "create" 
                  ? t("events.fillDetailsForNew")
                  : t("events.updateDetails")
                }
              </p>
            </div>
          </div>
          
          <div className="mt-5 md:mt-0 md:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className="overflow-hidden shadow">
              <CardContent className="px-4 py-5 sm:p-6 space-y-6">
                <h4 className="text-md font-medium text-gray-900 dark:text-white">
                  {t("events.basicInformation")}
                </h4>
                
                <div className="grid grid-cols-6 gap-6">
                  <div className="col-span-6 sm:col-span-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("events.eventTitle")}</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={t("events.titlePlaceholder")}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="col-span-6 sm:col-span-2">
                    <FormField
                      control={form.control}
                      name="eventType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("events.eventType")}</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("events.selectType")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="conference">{t("events.types.conference")}</SelectItem>
                              <SelectItem value="workshop">{t("events.types.workshop")}</SelectItem>
                              <SelectItem value="seminar">{t("events.types.seminar")}</SelectItem>
                              <SelectItem value="training">{t("events.types.training")}</SelectItem>
                              <SelectItem value="symposium">{t("events.types.symposium")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="col-span-6">
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("events.description")}</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder={t("events.descriptionPlaceholder")}
                              className="min-h-32"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Location and Schedule */}
            <Card className="overflow-hidden shadow">
              <CardContent className="px-4 py-5 sm:p-6 space-y-6">
                <h4 className="text-md font-medium text-gray-900 dark:text-white">
                  {t("events.locationAndSchedule")}
                </h4>
                
                <div className="grid grid-cols-6 gap-6">
                  <div className="col-span-6 sm:col-span-3">
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("events.location")}</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={t("events.locationPlaceholder")}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="col-span-6 sm:col-span-3">
                    <FormField
                      control={form.control}
                      name="eventLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("events.eventLevel")}</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("events.selectLevel")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="national">{t("events.levels.national")}</SelectItem>
                              <SelectItem value="provincial">{t("events.levels.provincial")}</SelectItem>
                              <SelectItem value="local">{t("events.levels.local")}</SelectItem>
                              <SelectItem value="hospital">{t("events.levels.hospital")}</SelectItem>
                              <SelectItem value="department">{t("events.levels.department")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="col-span-6">
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("events.address")}</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={t("events.addressPlaceholder")}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="col-span-6 sm:col-span-3">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("events.startDate")}</FormLabel>
                          <FormControl>
                            <Input 
                              type="date"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="col-span-6 sm:col-span-3">
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("events.endDate")}</FormLabel>
                          <FormControl>
                            <Input 
                              type="date"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="col-span-6 sm:col-span-3">
                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("events.startTime")}</FormLabel>
                          <FormControl>
                            <Input 
                              type="time"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="col-span-6 sm:col-span-3">
                    <FormField
                      control={form.control}
                      name="endTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("events.endTime")}</FormLabel>
                          <FormControl>
                            <Input 
                              type="time"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Capacity and Registration */}
            <Card className="overflow-hidden shadow">
              <CardContent className="px-4 py-5 sm:p-6 space-y-6">
                <h4 className="text-md font-medium text-gray-900 dark:text-white">
                  {t("events.capacityAndRegistration")}
                </h4>
                
                <div className="grid grid-cols-6 gap-6">
                  <div className="col-span-6 sm:col-span-3">
                    <FormField
                      control={form.control}
                      name="capacity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("events.maximumCapacity")}</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              placeholder="e.g. 200"
                              {...field} 
                              onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>{t("events.capacityDescription")}</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="col-span-6 sm:col-span-3">
                    <FormField
                      control={form.control}
                      name="registrationDeadline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("events.registrationDeadline")}</FormLabel>
                          <FormControl>
                            <Input 
                              type="date"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="col-span-6 sm:col-span-3">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("events.status")}</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("events.selectStatus")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="draft">{t("events.statuses.draft")}</SelectItem>
                              <SelectItem value="upcoming">{t("events.statuses.upcoming")}</SelectItem>
                              <SelectItem value="active">{t("events.statuses.active")}</SelectItem>
                              <SelectItem value="completed">{t("events.statuses.completed")}</SelectItem>
                              <SelectItem value="cancelled">{t("events.statuses.cancelled")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="col-span-6">
                    <FormField
                      control={form.control}
                      name="coverImage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("events.coverImage")}</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={t("events.coverImageUrl")}
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>{t("events.coverImageDescription")}</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="col-span-6">
                    <FormField
                      control={form.control}
                      name="autoApproveRegistrations"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>{t("events.autoApproveRegistrations")}</FormLabel>
                            <FormDescription>
                              {t("events.autoApproveDescription")}
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Form actions */}
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                className="mr-3"
                disabled={isLoading}
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="mr-3"
                disabled={isLoading}
                onClick={() => form.handleSubmit((data) => onSubmit({ ...data, status: "draft" }))()}
              >
                {t("events.saveAsDraft")}
              </Button>
              <Button
                type="submit"
                variant="default"
                disabled={isLoading}
              >
                {isLoading ? t("common.saving") : mode === "create" ? t("events.createEvent") : t("events.updateEvent")}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
};

export default EventForm;
