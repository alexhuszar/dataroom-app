"use client";

import { DataTable } from "@/components/DataTable";
import { Search } from "@/components/Search";
import { Loading } from "@/components/Loading";
import { useSearchParams } from "next/navigation";
import { useDashboardData } from "@/lib/hooks/useDashBoardData";

export const RecentFilesBoard = () => {
  const { files, isLoading: isDataLoading } = useDashboardData({
    mode: "files",
  });
  const searchParams = useSearchParams();

  const sort = searchParams?.get("sort") || "createdAt-desc";

  return (
    <section className="dashboard-colum-wrap relative">
      <div className="mt-1 flex justify-center">
        <Search />
      </div>

      {isDataLoading && <Loading />}

      <DataTable folders={[]} files={files} currentSort={sort} />
    </section>
  );
};
