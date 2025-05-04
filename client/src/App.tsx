import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { LanguageProvider } from "@/providers/LanguageProvider";
import Layout from "@/components/layout/Layout";
import Dashboard from "@/pages/dashboard";
// Import existing pages
import LoginPage from "./pages/auth/login";
import RegisterPage from "./pages/auth/register";
import ForgotPasswordPage from "./pages/auth/forgot-password";
import ResetPasswordPage from "./pages/auth/reset-password";
import RolesPage from "./pages/roles";
import { useAuth } from "./hooks/useAuth";

// Temporary placeholders for pages that don't exist yet
const EventsPage = () => <div>Events Page</div>;
const CreateEventPage = () => <div>Create Event Page</div>;
const EventDetailsPage = () => <div>Event Details Page</div>;
const CertificatesPage = () => <div>Certificates Page</div>;
const CertificateDetailsPage = () => <div>Certificate Details Page</div>;
const CertificateVerifyPage = () => <div>Certificate Verify Page</div>;
const UsersPage = () => <div>Users Page</div>;
const MediaPage = () => <div>Media Page</div>;
const ReportsPage = () => <div>Reports Page</div>;
const LogsPage = () => <div>Logs Page</div>;
const SettingsPage = () => <div>Settings Page</div>;
const ProfilePage = () => <div>Profile Page</div>;

// ProtectedRoute component to handle authentication
function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType<any>, [key: string]: any }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;
  
  if (!isAuthenticated) {
    // Redirect to login
    window.location.href = "/login";
    return null;
  }
  
  return <Component {...rest} />;
}

function AppRoutes() {
  return (
    <Switch>
      {/* Auth Routes */}
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password/:token" component={ResetPasswordPage} />
      <Route path="/certificates/verify/:number" component={CertificateVerifyPage} />
      
      {/* Protected Routes */}
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/events" component={() => <ProtectedRoute component={EventsPage} />} />
      <Route path="/events/create" component={() => <ProtectedRoute component={CreateEventPage} />} />
      <Route path="/events/:id" component={(params: any) => <ProtectedRoute component={EventDetailsPage} id={params.params.id} />} />
      <Route path="/certificates" component={() => <ProtectedRoute component={CertificatesPage} />} />
      <Route path="/certificates/:id" component={(params: any) => <ProtectedRoute component={CertificateDetailsPage} id={params.params.id} />} />
      <Route path="/users" component={() => <ProtectedRoute component={UsersPage} />} />
      <Route path="/roles" component={() => <ProtectedRoute component={RolesPage} />} />
      <Route path="/media" component={() => <ProtectedRoute component={MediaPage} />} />
      <Route path="/reports" component={() => <ProtectedRoute component={ReportsPage} />} />
      <Route path="/logs" component={() => <ProtectedRoute component={LogsPage} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={SettingsPage} />} />
      <Route path="/profile" component={() => <ProtectedRoute component={ProfilePage} />} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <Layout>
              <AppRoutes />
            </Layout>
            <Toaster />
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
