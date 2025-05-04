import React, { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Eye, Edit, Award, CalendarDays, Users, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Event } from "@shared/schema";
import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface EventsListProps {
  events: (Event & { participantsCount?: number })[];
  isLoading: boolean;
  onFilter: (filters: any) => void;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
}

// Helper to get status badge color
const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "upcoming":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "completed":
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    case "cancelled":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  }
};

// Helper to get event type icon
const getEventTypeIcon = (type: string) => {
  switch (type) {
    case "conference":
      return <Calendar className="text-primary-600 dark:text-primary-300" />;
    case "workshop":
      return <Calendar className="text-blue-600 dark:text-blue-300" />;
    case "seminar":
      return <Calendar className="text-purple-600 dark:text-purple-300" />;
    case "training":
      return <Calendar className="text-green-600 dark:text-green-300" />;
    case "symposium":
      return <Calendar className="text-orange-600 dark:text-orange-300" />;
    default:
      return <Calendar className="text-gray-600 dark:text-gray-300" />;
  }
};

const EventsList: React.FC<EventsListProps> = ({
  events,
  isLoading,
  onFilter,
  pagination,
  onPageChange
}) => {
  const { t } = useTranslation();
  const { can } = usePermissions();
  
  // Filter state
  const [filters, setFilters] = useState({
    type: "all",
    status: "all",
    location: "",
    startDate: "",
    endDate: "",
  });
  
  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilter(newFilters);
  };
  
  // Handle filter reset
  const handleResetFilters = () => {
    const resetFilters = {
      type: "all",
      status: "all",
      location: "",
      startDate: "",
      endDate: "",
    };
    setFilters(resetFilters);
    onFilter(resetFilters);
  };
  
  return (
    <div>
      {/* Filters */}
      <Card className="bg-white dark:bg-gray-800 shadow mb-6">
        <CardContent className="p-6">
          <div className="md:grid md:grid-cols-4 md:gap-6">
            <div className="md:col-span-1">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t("events.filterEvents")}</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("events.filterDescription")}</p>
            </div>
            <div className="mt-5 md:mt-0 md:col-span-3">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-2">
                  <label htmlFor="event-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("events.eventType")}
                  </label>
                  <Select
                    value={filters.type}
                    onValueChange={(value) => handleFilterChange("type", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={t("events.selectType")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("events.allTypes")}</SelectItem>
                      <SelectItem value="conference">{t("events.types.conference")}</SelectItem>
                      <SelectItem value="workshop">{t("events.types.workshop")}</SelectItem>
                      <SelectItem value="seminar">{t("events.types.seminar")}</SelectItem>
                      <SelectItem value="training">{t("events.types.training")}</SelectItem>
                      <SelectItem value="symposium">{t("events.types.symposium")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="sm:col-span-2">
                  <label htmlFor="event-status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("events.status")}
                  </label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => handleFilterChange("status", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={t("events.selectStatus")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("events.allStatus")}</SelectItem>
                      <SelectItem value="draft">{t("events.statuses.draft")}</SelectItem>
                      <SelectItem value="upcoming">{t("events.statuses.upcoming")}</SelectItem>
                      <SelectItem value="active">{t("events.statuses.active")}</SelectItem>
                      <SelectItem value="completed">{t("events.statuses.completed")}</SelectItem>
                      <SelectItem value="cancelled">{t("events.statuses.cancelled")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="sm:col-span-2">
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("events.location")}
                  </label>
                  <Input
                    id="location"
                    name="location"
                    value={filters.location}
                    onChange={(e) => handleFilterChange("location", e.target.value)}
                    className="mt-1"
                    placeholder={t("events.enterLocation")}
                  />
                </div>
                
                <div className="sm:col-span-3">
                  <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("events.startDate")}
                  </label>
                  <Input
                    id="start-date"
                    name="start-date"
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange("startDate", e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div className="sm:col-span-3">
                  <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("events.endDate")}
                  </label>
                  <Input
                    id="end-date"
                    name="end-date"
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange("endDate", e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResetFilters}
                  className="mr-3"
                >
                  {t("events.resetFilters")}
                </Button>
                <Button
                  type="button"
                  variant="default"
                  onClick={() => onFilter(filters)}
                >
                  {t("events.applyFilters")}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Events List */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        {isLoading ? (
          <div className="py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t("common.loading")}</p>
          </div>
        ) : events.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">{t("events.noEventsFound")}</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {events.map((event) => (
              <li key={event.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12 bg-primary-100 dark:bg-primary-900 rounded-md flex items-center justify-center">
                        {getEventTypeIcon(event.eventType)}
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-primary-600 dark:text-primary-400">{event.title}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{event.location}</p>
                      </div>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <span className={cn(
                        "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                        getStatusColor(event.status)
                      )}>
                        {t(`events.statuses.${event.status}`)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <CalendarDays className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
                        {format(new Date(event.startDate), "MMM dd, yyyy")}
                        {event.endDate && event.endDate !== event.startDate && (
                          <> - {format(new Date(event.endDate), "MMM dd, yyyy")}</>
                        )}
                      </p>
                      <p className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400 sm:mt-0 sm:ml-6">
                        <Users className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
                        {event.participantsCount !== undefined ? event.participantsCount : 0} {t("events.participants")}
                      </p>
                      <p className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400 sm:mt-0 sm:ml-6">
                        <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
                        {event.eventLevel}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center sm:mt-0">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="text-primary-700 bg-primary-100 hover:bg-primary-200 dark:bg-primary-900 dark:text-primary-300 dark:hover:bg-primary-800"
                      >
                        <Link href={`/events/${event.id}`}>
                          <Eye className="mr-2 h-4 w-4" /> {t("common.view")}
                        </Link>
                      </Button>
                      
                      {can("event:update") && (
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="ml-3 text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
                        >
                          <Link href={`/events/${event.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" /> {t("common.edit")}
                          </Link>
                        </Button>
                      )}
                      
                      {can("certificate:read") && (
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="ml-3 text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                        >
                          <Link href={`/events/${event.id}/certificates`}>
                            <Award className="mr-2 h-4 w-4" /> {t("common.certificates")}
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        
        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <nav className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
            <div className="hidden sm:block">
              <p className="text-sm text-gray-700 dark:text-gray-400">
                {t("pagination.showing")} <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> {t("pagination.to")}{" "}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{" "}
                {t("pagination.of")} <span className="font-medium">{pagination.total}</span> {t("pagination.results")}
              </p>
            </div>
            <div className="flex-1 flex justify-between sm:justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                {t("pagination.previous")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="ml-3"
              >
                {t("pagination.next")}
              </Button>
            </div>
          </nav>
        )}
      </div>
    </div>
  );
};

export default EventsList;
