"use client";

import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { useFile } from "@/lib/contexts/FileContext";
import { Search as SearchIcon } from "lucide-react";

export const Search = () => {
  const { getFiles, clearFiles } = useFile();
  const [query, setQuery] = useState("");
  useEffect(() => {
    if (!query) {
      setQuery("");
      clearFiles();
    }

    const fetchFiles = async () => {
      await getFiles({ types: [], searchText: query });
    };

    fetchFiles();
  }, [getFiles, clearFiles, query]);

  return (
    <div className="search">
      <div className="search-input-wrapper">
        <SearchIcon />
        <Input
          value={query}
          placeholder="Search..."
          className="search-input"
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
    </div>
  );
};
