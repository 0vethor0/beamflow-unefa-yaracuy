import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const {
    isAuthenticated,
    loading,
    hasAdditionalData,
    userStatus,
    isLoadingAdditionalData,
  } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      navigate({ to: "/login", search: { redirect: window.location.pathname } });
      return;
    }
    // Wait until additional-data check has resolved
    if (hasAdditionalData === null || isLoadingAdditionalData) return;

    if (!hasAdditionalData) {
      navigate({ to: "/complete-profile" });
      return;
    }
    if (userStatus === "pending" || userStatus === "rejected") {
      navigate({ to: "/waiting-approval" });
    }
  }, [
    isAuthenticated,
    loading,
    hasAdditionalData,
    userStatus,
    isLoadingAdditionalData,
    navigate,
  ]);

  const ready =
    !loading &&
    isAuthenticated &&
    hasAdditionalData === true &&
    userStatus === "approved";

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return <Outlet />;
}
