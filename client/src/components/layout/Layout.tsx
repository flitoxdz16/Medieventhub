import React, { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();
  
  // Check if current page is an auth page
  const isAuthPage = [
    "/login", 
    "/register", 
    "/forgot-password", 
    "/reset-password",
  ].some(path => location.startsWith(path)) || location.includes("/certificates/verify");
  
  // If loading auth state, show minimal loading screen
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // If not authenticated and not on auth page, the App component will redirect to login
  
  // For auth pages, render without layout
  if (isAuthPage) {
    return <main className="bg-gray-50 dark:bg-gray-900 min-h-screen">{children}</main>;
  }
  
  // For authenticated pages, render with layout
  return (
    <div className="min-h-screen flex flex-col">
      <Header isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
        
        {/* Backdrop for mobile - only shows when sidebar is open on mobile */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 z-10 bg-gray-600 bg-opacity-75 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}
        
        {/* Main content area */}
        <main className="flex-1 overflow-y-auto focus:outline-none bg-gray-50 dark:bg-gray-900">
          <div className="py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
