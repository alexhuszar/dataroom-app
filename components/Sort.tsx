"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { sortTypes } from "@/constants";
import { ArrowDownAZ, ArrowUpZA } from "lucide-react";

const Sort = () => {
  const path = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSort = searchParams?.get("sort") || sortTypes[0].value;

  const getSortLabel = (value: string) => {
    const sortType = sortTypes.find((s) => s.value === value);
    if (!sortType) return sortTypes[0].label;

    const [field, direction] = value.split("-");
    const arrow =
      direction === "desc" ? (
        <ArrowDownAZ size={12} />
      ) : (
        <ArrowUpZA size={12} />
      );
    return sortType.label + arrow;
  };

  const handleSort = (value: string) => {
    const currentParams = new URLSearchParams(searchParams?.toString());
    currentParams.set("sort", value);
    router.push(`${path}?${currentParams.toString()}`);
  };

  return (
    <Select onValueChange={handleSort} value={currentSort}>
      <SelectTrigger
        className="sort-select"
        aria-label="Sort files and folders"
      >
        <SelectValue placeholder={getSortLabel(currentSort)} />
      </SelectTrigger>
      <SelectContent className="sort-select-content">
        {sortTypes.map((sort) => (
          <SelectItem
            key={sort.label}
            className="shad-select-item"
            value={sort.value}
          >
            {sort.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default Sort;
