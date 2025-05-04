import React from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import EventForm from "@/components/events/EventForm";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

const CreateEventPage = () => {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Create event mutation
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/events", {
        ...data,
        createdById: user?.id,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: t("events.createSuccess"),
        description: t("events.createSuccessMessage"),
      });
      // Invalidate events query cache
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      // Navigate to the new event page
      navigate(`/events/${data.id}`);
    },
    onError: (error) => {
      console.error("Error creating event:", error);
      toast({
        title: t("events.createError"),
        description: t("events.createErrorMessage"),
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const handleSubmit = (data: any) => {
    mutate(data);
  };
  
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t("events.createTitle")}</h1>
        <div className="mt-3 sm:mt-0 sm:ml-4">
          <Button
            variant="outline"
            onClick={() => navigate("/events")}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            {t("events.backToEvents")}
          </Button>
        </div>
      </div>
      
      <div className="mt-6">
        <EventForm
          onSubmit={handleSubmit}
          isLoading={isPending}
          mode="create"
        />
      </div>
    </div>
  );
};

export default CreateEventPage;
