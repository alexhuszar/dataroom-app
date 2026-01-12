"use client";

import DataTable from "@/components/DataTable";
import { useDashboardData, FetchMode } from "@/lib/hooks/useDashBoardData";
import Search from "@/components/Search";
import { useSearchParams } from "next/navigation";
import Loading from "./Loading";

const Dashboard = ({ mode, title }: { mode?: FetchMode, title?: string }) => {
  const { files, folders, isLoading } = useDashboardData({ mode });

  const searchParams = useSearchParams();

  const sort = searchParams?.get("sort") || "createdAt-desc";

  return (
    <section className="dashboard-recent-files relative">
      <h1 className="mb-4 text-2xl font-bold text-light-100">{title}</h1>

      <div className="mt-9 flex justify-center">
        <Search />
      </div>

      {isLoading && <Loading />}

      <DataTable folders={folders} files={files} currentSort={sort} />
    </section>
  );
};

export default Dashboard;
