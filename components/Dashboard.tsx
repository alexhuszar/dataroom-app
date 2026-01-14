"use client";

import DataTable from "@/components/DataTable";
import { useDashboardData } from "@/lib/hooks/useDashBoardData";
import Search from "@/components/Search";
import { useSearchParams } from "next/navigation";
import Loading from "./Loading";
import { useAuth } from "@/lib/contexts/AuthContext";
import ActionButtons from "./ActionButtons";

const Dashboard = () => {
  const { files, folders, isLoading: isDataLoading } = useDashboardData();
  const { user, isAuthenticated, isLoading } = useAuth();
  const searchParams = useSearchParams();

  const sort = searchParams?.get("sort") || "createdAt-desc";

  return (
    <section className="dashboard-colum-wrap relative">
      <div className="mt-1 flex justify-center">
        <Search />
      </div>

      {isLoading && isDataLoading && <Loading />}

      {isAuthenticated && user && (
        <ActionButtons ownerId={user?.id} accountId={user?.accountId} className="sm:hidden " />
      )}

      <DataTable folders={folders} files={files} currentSort={sort} />
    </section>
  );
};

export default Dashboard;
