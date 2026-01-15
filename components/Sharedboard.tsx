"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { useShare } from "@/lib/contexts/ShareContext";
import { Search } from "@/components/Search";
import { Loading } from "@/components/Loading";
import { useSearchParams } from "next/navigation";

const SharedBoard = () => {
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
    <section className="dashboard-colum-wrap relative">
      <div className="mt-1 flex justify-center">
        <Search />
      </div>

      {isLoading && <Loading />}

      {!isLoading && <DataTable folders={[]} files={sharedFiles} currentSort={sort} emptyMessage="No share files found!" />}

    </section>
  );
};

