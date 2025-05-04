import React from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Calendar, 
  Award, 
  Users, 
  FileImage, 
  BarChart, 
  History, 
  Settings,
  ChevronDown,
  ChevronRight 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useTranslation } from "react-i18next";

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ 
  href, 
  icon, 
  label, 
  active,
  onClick
}) => {
  const { isRtl } = useLanguage();
  
  return (
    <Link 
      href={href} 
      onClick={onClick} 
      className={cn(
        "group flex items-center px-2 py-2 text-base font-medium rounded-md",
        active 
          ? "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400" 
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
      )}
    >
      <div className={cn(
        "text-lg",
        active 
          ? "text-primary-500 dark:text-primary-400" 
          : "text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400",
        isRtl ? "ml-3" : "mr-3"
      )}>
        {icon}
      </div>
      {label}
    </Link>
  );
};

interface CollapsibleNavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  items: {
    href: string;
    label: string;
    active: boolean;
  }[];
}

const CollapsibleNavItem: React.FC<CollapsibleNavItemProps> = ({ 
  icon, 
  label, 
  active, 
  items 
}) => {
  const [isOpen, setIsOpen] = React.useState(active);
  const { isRtl } = useLanguage();
  
  return (
    <div>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className={cn(
          "w-full group flex items-center px-2 py-2 text-base font-medium rounded-md",
          active 
            ? "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400" 
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
        )}
      >
        <div className={cn(
          "text-lg",
          active 
            ? "text-primary-500 dark:text-primary-400" 
            : "text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400",
          isRtl ? "ml-3" : "mr-3"
        )}>
          {icon}
        </div>
        <span className="flex-1">{label}</span>
        <div className={cn(
          "text-gray-500 text-sm transition-transform duration-200",
          isOpen && "transform rotate-180"
        )}>
          <ChevronDown size={16} />
        </div>
      </button>
      
      {isOpen && (
        <div className={cn("mt-1 space-y-1", isRtl ? "pr-10" : "pl-10")}>
          {items.map((item, index) => (
            <Link 
              key={index} 
              href={item.href}
              className={cn(
                "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                item.active 
                  ? "text-primary-600 dark:text-primary-400" 
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const [location] = useLocation();
  const { can } = usePermissions();
  const { user } = useAuth();
  const { t } = useTranslation();
  
  // Helper function to check if a path is active
  const isActive = (path: string) => location === path || (path !== "/" && location.startsWith(path));
  
  // Close sidebar on mobile when navigating
  const handleNavigation = () => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };
  
  return (
    <div 
      className={cn(
        "fixed inset-y-0 pt-16 left-0 z-20 w-64 transition duration-300 transform bg-white dark:bg-gray-800 overflow-y-auto lg:translate-x-0 lg:static lg:inset-0 shadow-md",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <nav className="mt-5 px-2 space-y-1">
        {/* Dashboard */}
        <NavItem 
          href="/" 
          icon={<LayoutDashboard />} 
          label={t("sidebar.dashboard")} 
          active={isActive("/") || isActive("/dashboard")}
          onClick={handleNavigation}
        />
        
        {/* Events */}
        <CollapsibleNavItem 
          icon={<Calendar />} 
          label={t("sidebar.events")} 
          active={isActive("/events")}
          items={[
            { 
              href: "/events", 
              label: t("sidebar.allEvents"), 
              active: isActive("/events") && !isActive("/events/create") && !location.match(/^\/events\/\d+$/)
            },
            { 
              href: "/events/create", 
              label: t("sidebar.createEvent"), 
              active: isActive("/events/create") 
            }
          ]}
        />
        
        {/* Certificates */}
        <NavItem 
          href="/certificates" 
          icon={<Award />} 
          label={t("sidebar.certificates")} 
          active={isActive("/certificates")}
          onClick={handleNavigation}
        />
        
        {/* Users & Roles - only for admins */}
        {can("user:read") && (
          <CollapsibleNavItem 
            icon={<Users />} 
            label={t("sidebar.userManagement")} 
            active={isActive("/users") || isActive("/roles")}
            items={[
              { 
                href: "/users", 
                label: t("sidebar.manageUsers"), 
                active: isActive("/users") 
              },
              { 
                href: "/roles", 
                label: t("sidebar.rolesPermissions"), 
                active: isActive("/roles") 
              }
            ]}
          />
        )}
        
        {/* Media Library */}
        <NavItem 
          href="/media" 
          icon={<FileImage />} 
          label={t("sidebar.mediaLibrary")} 
          active={isActive("/media")}
          onClick={handleNavigation}
        />
        
        {/* Reports - for managers and admins */}
        {can("report:generate") && (
          <NavItem 
            href="/reports" 
            icon={<BarChart />} 
            label={t("sidebar.reports")} 
            active={isActive("/reports")}
            onClick={handleNavigation}
          />
        )}
        
        {/* Activity Logs - for admins */}
        {can("log:view") && (
          <NavItem 
            href="/logs" 
            icon={<History />} 
            label={t("sidebar.activityLogs")} 
            active={isActive("/logs")}
            onClick={handleNavigation}
          />
        )}
        
        {/* Settings */}
        <NavItem 
          href="/settings" 
          icon={<Settings />} 
          label={t("sidebar.settings")} 
          active={isActive("/settings")}
          onClick={handleNavigation}
        />
      </nav>
      
      {/* User Info */}
      <div className="mt-auto border-t border-gray-200 dark:border-gray-700 pt-4 pb-6 px-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <img 
              src={user?.profileImage || "https://ui-avatars.com/api/?name=" + encodeURIComponent(user?.fullName || "User")} 
              alt={user?.fullName || "User"} 
              className="h-8 w-8 rounded-full"
            />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {user?.fullName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user?.role.replace(/_/g, ' ')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
