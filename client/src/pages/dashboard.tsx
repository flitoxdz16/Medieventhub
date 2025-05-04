import React from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { 
  CalendarDays, 
  Users, 
  Award, 
  Clock
} from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";
import ActivityCard from "@/components/dashboard/ActivityCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";

const Dashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  // Fetch dashboard stats
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    retry: false,
  });
  
  // Fetch recent events
  const { data: recentEvents, isLoading: isLoadingEvents } = useQuery({
    queryKey: ['/api/events', { limit: 3 }],
    select: (data) => data.events,
  });
  
  // Fetch recent activity
  const { data: recentActivities, isLoading: isLoadingActivities } = useQuery({
    queryKey: ['/api/logs', { limit: 3 }],
    select: (data) => data.logs,
  });
  
  // Format activities for display
  const formattedActivities = React.useMemo(() => {
    if (!recentActivities) return [];
    
    return recentActivities.map((activity: any) => ({
      id: activity.id,
      user: {
        name: activity.user.fullName,
        image: activity.user.profileImage,
      },
      description: getActivityDescription(activity),
      time: new Date(activity.createdAt).toLocaleString(),
    }));
  }, [recentActivities]);
  
  // Helper to get activity description
  function getActivityDescription(activity: any) {
    const action = activity.action;
    const resourceType = activity.resourceType;
    const details = activity.details;
    
    if (action === "create" && resourceType === "event") {
      return t("dashboard.activityCreatedEvent", { title: details?.title || "an event" });
    } else if (action === "update" && resourceType === "event") {
      return t("dashboard.activityUpdatedEvent", { title: details?.title || "an event" });
    } else if (action === "register" && resourceType === "user") {
      return t("dashboard.activityRegistered", { email: details?.email || "new user" });
    } else if (action === "generate_certificate") {
      return t("dashboard.activityGeneratedCertificate", { number: details?.certificateNumber || "certificate" });
    } else if (action === "login") {
      return t("dashboard.activityLoggedIn");
    } else {
      return t("dashboard.activityPerformed", { 
        action: t(`logs.actions.${action}`) || action,
        resource: resourceType || ""
      });
    }
  }
  
  // Format events for display
  const formattedEvents = React.useMemo(() => {
    if (!recentEvents) return [];
    
    return recentEvents.map((event: any) => ({
      id: event.id,
      title: event.title,
      description: `in ${event.location}`,
      time: new Date(event.startDate).toLocaleDateString(),
      status: {
        label: t(`events.statuses.${event.status}`),
        color: getStatusColor(event.status),
      }
    }));
  }, [recentEvents, t]);
  
  // Helper to get status color class
  function getStatusColor(status: string) {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "upcoming":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "completed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "draft":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  }
  
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t("dashboard.title")}</h1>
        <div className="mt-3 sm:mt-0 sm:ml-4">
          <a href="/events/create">
            <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
              <CalendarDays className="h-4 w-4 mr-2" />
              {t("dashboard.createNewEvent")}
            </button>
          </a>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {isLoadingStats ? (
          <>
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
          </>
        ) : (
          <>
            <StatsCard
              title={t("dashboard.totalEvents")}
              value={stats?.eventsCount || 0}
              icon={<CalendarDays />}
              iconBgColor="bg-primary-100 dark:bg-primary-900"
              iconTextColor="text-primary-600 dark:text-primary-300"
              linkHref="/events"
              linkText={t("dashboard.viewAll")}
            />
            
            <StatsCard
              title={t("dashboard.activeParticipants")}
              value={stats?.participantsCount || 0}
              icon={<Users />}
              iconBgColor="bg-green-100 dark:bg-green-900"
              iconTextColor="text-green-600 dark:text-green-300"
              linkHref="/users"
              linkText={t("dashboard.viewAll")}
            />
            
            <StatsCard
              title={t("dashboard.certificatesGenerated")}
              value={stats?.certificatesCount || 0}
              icon={<Award />}
              iconBgColor="bg-yellow-100 dark:bg-yellow-900"
              iconTextColor="text-yellow-600 dark:text-yellow-300"
              linkHref="/certificates"
              linkText={t("dashboard.viewAll")}
            />
            
            <StatsCard
              title={t("dashboard.upcomingEvents")}
              value={stats?.upcomingEventsCount || 0}
              icon={<Clock />}
              iconBgColor="bg-indigo-100 dark:bg-indigo-900"
              iconTextColor="text-indigo-600 dark:text-indigo-300"
              linkHref="/events?status=upcoming"
              linkText={t("dashboard.viewAll")}
            />
          </>
        )}
      </div>
      
      {/* Recent Events and Activity */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Events */}
        <ActivityCard
          title={t("dashboard.recentEvents")}
          items={isLoadingEvents ? [] : formattedEvents}
          viewAllLink="/events"
          viewAllText={t("dashboard.viewAllEvents")}
          emptyMessage={t("dashboard.noRecentEvents")}
        />
        
        {/* Recent Activity */}
        <ActivityCard
          title={t("dashboard.recentActivity")}
          items={isLoadingActivities ? [] : formattedActivities}
          viewAllLink="/logs"
          viewAllText={t("dashboard.viewAllActivity")}
          emptyMessage={t("dashboard.noRecentActivity")}
        />
      </div>
    </div>
  );
};

export default Dashboard;
