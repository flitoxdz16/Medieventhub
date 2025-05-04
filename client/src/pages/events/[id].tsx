import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ChevronLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import EventDetails from "@/components/events/EventDetails";
import EventForm from "@/components/events/EventForm";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { usePermissions } from "@/hooks/usePermissions";

interface EventDetailsPageProps {
  id: string;
}

const EventDetailsPage: React.FC<EventDetailsPageProps> = ({ id }) => {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { can } = usePermissions();
  const [isEditing, setIsEditing] = useState(false);
  
  // Fetch event details
  const { data: event, isLoading } = useQuery({
    queryKey: [`/api/events/${id}`],
  });
  
  // Update event mutation
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/events/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("events.updateSuccess"),
        description: t("events.updateSuccessMessage"),
      });
      // Invalidate event query cache
      queryClient.invalidateQueries({ queryKey: [`/api/events/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      // Exit edit mode
      setIsEditing(false);
    },
    onError: (error) => {
      console.error("Error updating event:", error);
      toast({
        title: t("events.updateError"),
        description: t("events.updateErrorMessage"),
        variant: "destructive",
      });
    },
  });
  
  // Handle edit event
  const handleEditEvent = () => {
    if (can("event:update")) {
      setIsEditing(true);
    }
  };
  
  // Handle form submission
  const handleSubmit = (data: any) => {
    mutate(data);
  };
  
  // Handle manage registrations
  const handleManageRegistrations = () => {
    navigate(`/events/${id}/registrations`);
  };
  
  if (isLoading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="mt-6 space-y-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }
  
  if (!event) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="pb-5 border-b border-gray-200">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t("events.notFound")}</h1>
        </div>
        <div className="mt-6 text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">{t("events.eventNotFoundMessage")}</p>
          <Button
            onClick={() => navigate("/events")}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            {t("events.backToEvents")}
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {isEditing ? t("events.editTitle") : t("events.detailsTitle")}
        </h1>
        <div className="mt-3 sm:mt-0 sm:ml-4">
          <Button
            variant="outline"
            onClick={() => isEditing ? setIsEditing(false) : navigate("/events")}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            {isEditing ? t("events.cancelEdit") : t("events.backToEvents")}
          </Button>
          
          {!isEditing && can("event:update") && (
            <Button
              variant="secondary"
              className="ml-3"
              onClick={handleEditEvent}
            >
              <Pencil className="h-4 w-4 mr-2" />
              {t("events.editEvent")}
            </Button>
          )}
        </div>
      </div>
      
      <div className="mt-6">
        {isEditing ? (
          <EventForm
            initialData={event}
            onSubmit={handleSubmit}
            isLoading={isPending}
            mode="edit"
          />
        ) : (
          <EventDetails
            event={event}
            onEditEvent={handleEditEvent}
            onManageRegistrations={handleManageRegistrations}
          />
        )}
      </div>
    </div>
  );
};

export default EventDetailsPage;
