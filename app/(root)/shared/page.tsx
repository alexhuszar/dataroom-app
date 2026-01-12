"use client";

import { useEffect, useState } from "react";
import DataTable from "@/components/DataTable";
import { useShare } from "@/lib/contexts/ShareContext";
import Search from "@/components/Search";
import Loading from "@/components/Loading";
import { useSearchParams } from "next/navigation";

const SharedPage = () => {
  const { sharedFiles, getSharedWithMe, isLoading } = useShare();
  const [hasLoaded, setHasLoaded] = useState(false);
  const searchParams = useSearchParams();

  const sort = searchParams?.get("sort") || "createdAt-desc";

  useEffect(() => {
    if (!hasLoaded) {
      getSharedWithMe();
      setHasLoaded(true);
    }
  }, [hasLoaded, getSharedWithMe]);

  return (
    <section className="dashboard-recent-files relative">
      <h1 className="mb-4 text-2xl font-bold text-light-100">
        Shared files:
      </h1>

      <div className="mt-9 flex justify-center">
        <Search />
      </div>

      {isLoading && <Loading />}

      <DataTable folders={[]} files={sharedFiles} currentSort={sort} emptyMessage="No share files found!" />

    </section>
  );
};

export default SharedPage;
