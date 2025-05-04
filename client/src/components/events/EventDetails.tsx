import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { format } from "date-fns";
import { Event, EventSpeaker, EventSchedule } from "@shared/schema";
import { 
  Award, 
  CalendarDays, 
  Clock, 
  Edit, 
  FileText, 
  MapPin, 
  Users,
  Building,
  Pencil,
  Trash2,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { usePermissions } from "@/hooks/usePermissions";
import { Badge } from "@/components/ui/badge";

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
    case "draft":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  }
};

interface EventDetailsProps {
  event: Event & {
    eventSchedules?: EventSchedule[];
    eventSpeakers?: EventSpeaker[];
    participantsCount?: number;
    registrationsCount?: number;
    certificatesCount?: number;
    createdBy?: {
      id: number;
      fullName: string;
      organization?: string;
    };
  };
  onEditEvent?: () => void;
  onManageRegistrations?: () => void;
}

const EventDetails: React.FC<EventDetailsProps> = ({
  event,
  onEditEvent,
  onManageRegistrations,
}) => {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Calculate capacity percentage
  const capacityPercentage = event.capacity 
    ? Math.min(100, Math.round(((event.registrationsCount || 0) / event.capacity) * 100)) 
    : 0;
  
  // Group schedules by date
  const schedulesByDate = event.eventSchedules?.reduce((acc, schedule) => {
    const date = format(new Date(schedule.date), "yyyy-MM-dd");
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(schedule);
    return acc;
  }, {} as Record<string, EventSchedule[]>) || {};
  
  const scheduleDates = Object.keys(schedulesByDate).sort();
  
  return (
    <div>
      {/* Event Header with Cover Image */}
      <div className="relative rounded-lg overflow-hidden h-64">
        <img
          src={event.coverImage || "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1500&q=80"}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-70"></div>
        <div className="absolute bottom-0 left-0 p-6">
          <div className="flex items-center space-x-2">
            <span className={cn(
              "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium",
              getStatusColor(event.status)
            )}>
              {t(`events.statuses.${event.status}`)}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {t(`events.levels.${event.eventLevel}`)}
            </span>
          </div>
          <h2 className="mt-2 text-3xl font-bold text-white">{event.title}</h2>
          <p className="text-xl text-gray-200">{event.location}</p>
        </div>
      </div>
      
      {/* Event Info Tabs */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg mt-6">
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <div className="border-b border-gray-200 dark:border-gray-700">
            <TabsList className="px-6 h-auto">
              <TabsTrigger 
                value="overview"
                className="py-4 px-1 border-b-2 border-transparent data-[state=active]:border-primary-500"
              >
                {t("events.tabs.overview")}
              </TabsTrigger>
              <TabsTrigger 
                value="schedule"
                className="py-4 px-1 border-b-2 border-transparent data-[state=active]:border-primary-500"
              >
                {t("events.tabs.schedule")}
              </TabsTrigger>
              <TabsTrigger 
                value="speakers"
                className="py-4 px-1 border-b-2 border-transparent data-[state=active]:border-primary-500"
              >
                {t("events.tabs.speakers")}
              </TabsTrigger>
              <TabsTrigger 
                value="participants"
                className="py-4 px-1 border-b-2 border-transparent data-[state=active]:border-primary-500"
              >
                {t("events.tabs.participants")}
              </TabsTrigger>
              <TabsTrigger 
                value="materials"
                className="py-4 px-1 border-b-2 border-transparent data-[state=active]:border-primary-500"
              >
                {t("events.tabs.materials")}
              </TabsTrigger>
              <TabsTrigger 
                value="certificates"
                className="py-4 px-1 border-b-2 border-transparent data-[state=active]:border-primary-500"
              >
                {t("events.tabs.certificates")}
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t("events.aboutEvent")}</h3>
                <div className="mt-4 text-gray-700 dark:text-gray-300 space-y-4">
                  <p>{event.description}</p>
                </div>
                
                {event.eventSchedules && event.eventSchedules.length > 0 && (
                  <>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-8">{t("events.highlights")}</h3>
                    <ul className="mt-4 text-gray-700 dark:text-gray-300 list-disc pl-5 space-y-2">
                      {event.eventSchedules.slice(0, 5).map((schedule, index) => (
                        <li key={index}>{schedule.title}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t("events.dateTime")}</h4>
                    <p className="mt-1 text-gray-900 dark:text-white">
                      {format(new Date(event.startDate), "MMMM d, yyyy")}
                      {event.endDate && new Date(event.endDate).toDateString() !== new Date(event.startDate).toDateString() && (
                        <> - {format(new Date(event.endDate), "MMMM d, yyyy")}</>
                      )}
                    </p>
                    {event.startTime && event.endTime && (
                      <p className="text-gray-900 dark:text-white">
                        {event.startTime} - {event.endTime}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t("events.location")}</h4>
                    <p className="mt-1 text-gray-900 dark:text-white">{event.location}</p>
                    {event.address && (
                      <p className="text-gray-900 dark:text-white">{event.address}</p>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t("events.organizer")}</h4>
                    <p className="mt-1 text-gray-900 dark:text-white">{event.createdBy?.fullName || "System"}</p>
                    {event.createdBy?.organization && (
                      <p className="text-gray-900 dark:text-white">{event.createdBy.organization}</p>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t("events.capacity")}</h4>
                    <p className="mt-1 text-gray-900 dark:text-white">
                      {event.capacity ? event.capacity : t("events.unlimited")}
                    </p>
                    {event.capacity && (
                      <>
                        <div className="mt-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                          <Progress value={capacityPercentage} className="h-2.5" />
                        </div>
                        <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                          {event.registrationsCount || 0} {t("events.registered")} ({capacityPercentage}%)
                        </p>
                      </>
                    )}
                  </div>
                  
                  {event.registrationDeadline && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t("events.registrationDeadline")}</h4>
                      <p className="mt-1 text-gray-900 dark:text-white">
                        {format(new Date(event.registrationDeadline), "MMMM d, yyyy")}
                      </p>
                    </div>
                  )}
                  
                  <div className="pt-4 flex flex-col space-y-3">
                    {can("event:update") && (
                      <Button 
                        variant="secondary" 
                        className="w-full justify-center"
                        onClick={onEditEvent}
                      >
                        <Edit className="mr-2 h-4 w-4" /> {t("events.editEvent")}
                      </Button>
                    )}
                    
                    {can("event:approve") && (
                      <Button 
                        variant="default" 
                        className="w-full justify-center"
                        onClick={onManageRegistrations}
                      >
                        <Users className="mr-2 h-4 w-4" /> {t("events.manageRegistrations")}
                      </Button>
                    )}
                    
                    {can("event:register") && event.status !== "completed" && event.status !== "cancelled" && (
                      <Button 
                        variant="outline" 
                        className="w-full justify-center"
                      >
                        <CalendarDays className="mr-2 h-4 w-4" /> {t("events.registerForEvent")}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Schedule Tab */}
          <TabsContent value="schedule" className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t("events.eventSchedule")}</h3>
              {can("event:update") && (
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> {t("events.addSession")}
                </Button>
              )}
            </div>
            
            {scheduleDates.length === 0 ? (
              <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                {t("events.noScheduleYet")}
              </div>
            ) : (
              <div className="space-y-8">
                {scheduleDates.map((date, index) => (
                  <div key={index} className="mb-8">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                      {t("events.day")} {index + 1} - {format(new Date(date), "MMMM d, yyyy")}
                    </h4>
                    <Card className="overflow-hidden">
                      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {schedulesByDate[date]
                          .sort((a, b) => a.startTime.localeCompare(b.startTime))
                          .map((schedule) => (
                            <li key={schedule.id}>
                              <div className="px-4 py-4 sm:px-6">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                                      {schedule.speakerId ? (
                                        <Users className="text-primary-600 dark:text-primary-300" />
                                      ) : (
                                        <CalendarDays className="text-primary-600 dark:text-primary-300" />
                                      )}
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-primary-600 dark:text-primary-400">{schedule.title}</div>
                                      {schedule.description && (
                                        <div className="text-sm text-gray-500 dark:text-gray-400">{schedule.description}</div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="ml-2 flex">
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                      {schedule.startTime} - {schedule.endTime}
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-2 sm:flex sm:justify-between">
                                  <div className="sm:flex">
                                    {schedule.location && (
                                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                        <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
                                        <p>{schedule.location}</p>
                                      </div>
                                    )}
                                  </div>
                                  {can("event:update") && (
                                    <div className="mt-2 flex items-center text-sm sm:mt-0">
                                      <Button variant="ghost" size="sm" className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300">
                                        <Pencil className="h-4 w-4 mr-1" /> {t("common.edit")}
                                      </Button>
                                      <Button variant="ghost" size="sm" className="ml-4 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300">
                                        <Trash2 className="h-4 w-4 mr-1" /> {t("common.delete")}
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </li>
                          ))}
                      </ul>
                    </Card>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          {/* Speakers Tab */}
          <TabsContent value="speakers" className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t("events.eventSpeakers")}</h3>
              {can("event:update") && (
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> {t("events.addSpeaker")}
                </Button>
              )}
            </div>
            
            {!event.eventSpeakers || event.eventSpeakers.length === 0 ? (
              <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                {t("events.noSpeakersYet")}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {event.eventSpeakers.map((speaker) => (
                  <Card key={speaker.id} className="overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-center">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={speaker.photo} alt={speaker.name} />
                          <AvatarFallback>{speaker.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="ml-4">
                          <h4 className="text-lg font-medium text-gray-900 dark:text-white">{speaker.name}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{speaker.title}</p>
                          {speaker.organization && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">{speaker.organization}</p>
                          )}
                        </div>
                      </div>
                      
                      {speaker.bio && (
                        <div className="mt-4 text-sm text-gray-700 dark:text-gray-300">
                          <p>{speaker.bio}</p>
                        </div>
                      )}
                      
                      {can("event:update") && (
                        <div className="mt-4 flex items-center justify-end space-x-2">
                          <Button variant="ghost" size="sm" className="text-primary-600 dark:text-primary-400">
                            <Pencil className="h-4 w-4 mr-1" /> {t("common.edit")}
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 dark:text-red-400">
                            <Trash2 className="h-4 w-4 mr-1" /> {t("common.delete")}
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          {/* Participants Tab */}
          <TabsContent value="participants" className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t("events.participants")}</h3>
            </div>
            
            <div className="text-center py-10">
              <Button asChild>
                <Link href={`/events/${event.id}/registrations`}>
                  <Users className="mr-2 h-4 w-4" /> {t("events.viewParticipants")}
                </Link>
              </Button>
            </div>
          </TabsContent>
          
          {/* Materials Tab */}
          <TabsContent value="materials" className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t("events.materials")}</h3>
              {can("media:upload") && (
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> {t("events.uploadMaterial")}
                </Button>
              )}
            </div>
            
            <div className="text-center py-10 text-gray-500 dark:text-gray-400">
              {t("events.noMaterialsYet")}
            </div>
          </TabsContent>
          
          {/* Certificates Tab */}
          <TabsContent value="certificates" className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t("events.certificates")}</h3>
              {can("certificate:generate") && (
                <Button>
                  <Award className="mr-2 h-4 w-4" /> {t("events.manageCertificates")}
                </Button>
              )}
            </div>
            
            <div className="text-center py-10">
              <Button asChild>
                <Link href={`/events/${event.id}/certificates`}>
                  <Award className="mr-2 h-4 w-4" /> {t("events.viewCertificates")}
                </Link>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EventDetails;
