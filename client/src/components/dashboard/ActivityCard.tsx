import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

interface ActivityItem {
  id: number;
  title: string;
  description: string;
  time: string;
  user?: {
    name: string;
    image?: string;
  };
  status?: {
    label: string;
    color: string;
  };
}

interface ActivityCardProps {
  title: string;
  items: ActivityItem[];
  viewAllLink: string;
  viewAllText: string;
  emptyMessage?: string;
}

const ActivityCard: React.FC<ActivityCardProps> = ({
  title,
  items,
  viewAllLink,
  viewAllText,
  emptyMessage = "No recent activity"
}) => {
  const { t } = useTranslation();
  
  return (
    <Card className="bg-white dark:bg-gray-800 shadow rounded-lg">
      <CardHeader className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
        <CardTitle className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {items.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            {emptyMessage}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {items.map((item) => (
              <li key={item.id}>
                <div className="px-5 py-4 flex items-center">
                  <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                    {item.user ? (
                      <div className="flex items-start">
                        <Avatar className="h-10 w-10 rounded-full">
                          <AvatarImage src={item.user.image} />
                          <AvatarFallback>{item.user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{item.user.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{item.time}</p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex text-sm">
                          <p className="font-medium text-primary-600 dark:text-primary-400 truncate">{item.title}</p>
                          {item.description && (
                            <p className="ml-1 flex-shrink-0 font-normal text-gray-500 dark:text-gray-400">{item.description}</p>
                          )}
                        </div>
                        <div className="mt-2 flex">
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <p>{item.time}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {item.status && (
                      <div className="mt-4 flex-shrink-0 sm:mt-0">
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                          item.status.color
                        )}>
                          {item.status.label}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <CardFooter className="bg-gray-50 dark:bg-gray-700 px-5 py-3 text-sm">
        <Link 
          href={viewAllLink}
          className="font-medium text-primary-700 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300"
        >
          {viewAllText}
        </Link>
      </CardFooter>
    </Card>
  );
};

export default ActivityCard;
