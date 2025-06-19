import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const LoginPage = lazy(() => import("@/pages/auth/login").then(module => ({ default: module.LoginPage })));
const DashboardLayout = lazy(() => import("@/layouts/dashboard-layout").then(module => ({ default: module.DashboardLayout })));
const ServerDetailPage = lazy(() => import("@/pages/server").then(module => ({ default: module.ServerDetailPage })));
const BouncesOverviewPage = lazy(() => import("@/pages/server/bounces/overview").then(module => ({ default: module.BouncesOverviewPage })));
const BouncedDomainsPage = lazy(() => import("@/pages/server/bounces/domains").then(module => ({ default: module.BouncedDomainsPage })));
const BouncedEmailsIndividualPage = lazy(() => import("@/pages/server/bounces/emails").then(module => ({ default: module.BouncedEmailsPage })));
const ProtectedRoute = lazy(() => import("@/components/utils/protected-route").then(module => ({ default: module.ProtectedRoute })));

const PageLoader = () => (
  <div className="w-full p-6 space-y-6">
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-10 w-32" />
    </div>
    <div className="flex gap-2">
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-10 w-32" />
    </div>
    <Skeleton className="h-96 w-full" />
  </div>
);

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <Suspense fallback={<PageLoader />}>
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <DashboardLayout />
          </Suspense>
        </ProtectedRoute>
      </Suspense>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/server" replace />,
      },
      {
        path: "server",
        element: (
          <Suspense fallback={<PageLoader />}>
            <ServerDetailPage />
          </Suspense>
        ),
      },
      {
        path: "server/:serverId",
        element: (
          <Suspense fallback={<PageLoader />}>
            <ServerDetailPage />
          </Suspense>
        ),
      },
      {
        path: "server/:serverId/bounces",
        element: (
          <Suspense fallback={<PageLoader />}>
            <BouncesOverviewPage />
          </Suspense>
        ),
      },
      {
        path: "server/:serverId/bounces/domain",
        element: (
          <Suspense fallback={<PageLoader />}>
            <BouncedDomainsPage />
          </Suspense>
        ),
      },
      {
        path: "server/:serverId/bounces/email",
        element: (
          <Suspense fallback={<PageLoader />}>
            <BouncedEmailsIndividualPage />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: "/login",
    element: (
      <Suspense fallback={<PageLoader />}>
        <LoginPage />
      </Suspense>
    ),
  },
]);