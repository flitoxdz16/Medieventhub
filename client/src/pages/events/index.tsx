import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import EventsList from "@/components/events/EventsList";
import { Skeleton } from "@/components/ui/skeleton";
import { usePermissions } from "@/hooks/usePermissions";

const EventsPage = () => {
  const { t } = useTranslation();
  const { can } = usePermissions();
  
  // Pagination and filter state
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    type: "all",
    status: "all",
    location: "",
    startDate: "",
    endDate: "",
    search: "",
  });
  
  // Fetch events with filtering and pagination
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['/api/events', { page, ...filters }],
  });
  
  // Handle filter change
  const handleFilter = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1); // Reset to first page when filters change
    refetch();
  };
  
  // Handle search
  const handleSearch = (search: string) => {
    setFilters(prev => ({ ...prev, search }));
    setPage(1);
    refetch();
  };
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    refetch();
  };
  
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t("events.managementTitle")}</h1>
        <div className="mt-3 sm:mt-0 sm:ml-4">
          {can("event:create") && (
            <Button asChild>
              <Link href="/events/create">
                <Plus className="h-4 w-4 mr-2" />
                {t("events.createNewEvent")}
              </Link>
            </Button>
          )}
        </div>
      </div>
      
      {isLoading ? (
        <div className="space-y-6 mt-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-[500px] w-full" />
        </div>
      ) : (
        <EventsList
          events={data?.events || []}
          isLoading={isLoading}
          onFilter={handleFilter}
          pagination={data?.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 }}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

export default EventsPage;
