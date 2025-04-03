import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/hooks/use-theme";
import { ProtectedRoute } from "@/lib/protected-route";
import CoursesPage from "@/pages/courses-page";
import CourseDetailPage from "@/pages/course-detail-page";
import MyLearningPage from "@/pages/my-learning-page";
import CheckoutPage from "@/pages/checkout-page";
import ProfilePage from "@/pages/profile-page";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminCourses from "@/pages/admin/courses";
import AdminUsers from "@/pages/admin/users";
import AdminNewCourse from "@/pages/admin/new-course";
import AdminEditCourse from "@/pages/admin/edit-course";
import AdminResources from "@/pages/admin/resources";
import PendingEnrollmentsPage from "@/pages/admin/pending-enrollments";
import VerificationSuccessPage from "@/pages/verification-success";
import DevVerificationPage from "@/pages/dev-verification-page";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/courses" component={CoursesPage} />
      <Route path="/courses/:slug" component={CourseDetailPage} />
      <Route path="/verification-success" component={VerificationSuccessPage} />
      <Route path="/dev-verify" component={DevVerificationPage} />
      <ProtectedRoute path="/my-learning" component={MyLearningPage} />
      <ProtectedRoute path="/checkout/:courseId" component={CheckoutPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/admin" component={AdminDashboard} allowedRoles={["admin"]} />
      <ProtectedRoute path="/admin/courses" component={AdminCourses} allowedRoles={["admin"]} />
      <ProtectedRoute path="/admin/users" component={AdminUsers} allowedRoles={["admin"]} />
      <ProtectedRoute path="/admin/courses/new" component={AdminNewCourse} allowedRoles={["admin"]} />
      <ProtectedRoute path="/admin/courses/:id/edit" component={AdminEditCourse} allowedRoles={["admin"]} />
      <ProtectedRoute path="/admin/pending-enrollments" component={PendingEnrollmentsPage} allowedRoles={["admin"]} />
      <ProtectedRoute path="/admin/resources" component={AdminResources} allowedRoles={["admin"]} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
