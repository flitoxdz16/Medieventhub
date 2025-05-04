import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  iconBgColor: string;
  iconTextColor: string;
  linkHref: string;
  linkText: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  iconBgColor,
  iconTextColor,
  linkHref,
  linkText,
}) => {
  const { t } = useTranslation();
  
  return (
    <Card className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
      <CardContent className="p-5">
        <div className="flex items-center">
          <div className={cn(
            "flex-shrink-0 rounded-md p-3",
            iconBgColor
          )}>
            <div className={cn(
              "text-xl",
              iconTextColor
            )}>
              {icon}
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</dt>
              <dd>
                <div className="text-xl font-semibold text-gray-900 dark:text-white">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
        <div className="text-sm">
          <Link 
            href={linkHref}
            className="font-medium text-primary-700 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300"
          >
            {linkText}
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
};

export default StatsCard;
