"use client";

import DataTable from "@/components/DataTable";
import { useDashboardData, FetchMode } from "@/lib/hooks/useDashBoardData";
import Search from "@/components/Search";
import { useSearchParams } from "next/navigation";
import Loading from "./Loading";

const Dashboard = ({ mode }: { mode?: FetchMode }) => {
  const { files, folders, isLoading } = useDashboardData({ mode });

  const searchParams = useSearchParams();

  const sort = searchParams?.get("sort") || "createdAt-desc";

  return (
    <section className="dashboard-recent-files relative">
      <div className="mt-9 flex justify-center">
        <Search />
      </div>

      {isLoading && <Loading />}

      <DataTable folders={folders} files={files} currentSort={sort} />
    </section>
  );
};

export default Dashboard;
