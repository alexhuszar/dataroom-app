"use client";

import { useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  ColumnDef,
  flexRender,
  SortingState,
} from "@tanstack/react-table";
import {
  ArrowDown10,
  ArrowDownAZ,
  ArrowUp10,
  ArrowUpZA,
  Folder,
  MoveDown,
  MoveUp,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Thumbnail } from "@/components/Thumbnail";
import { FormattedDateTime } from "@/components/FormattedDateTime";
import ActionDropdown from "@/components/ActionDropdown";
import { convertFileSize } from "@/lib/utils/file";

interface DataTableProps {
  folders: FolderDocumentType[];
  files: FileDocumentType[];
  currentSort?: string;
  emptyMessage?: string;
}

type TableRowData =
  | { type: "folder"; data: FolderDocumentType }
  | { type: "file"; data: FileDocumentType };

const getFileTypeName = (fileType: string): string => {
  const typeMap: Record<string, string> = {
    document: "Document",
    other: "Other",
  };
  return typeMap[fileType] || "File";
};

const DataTable = ({
  folders,
  files,
  currentSort,
  emptyMessage = "No files or folders found!",
}: DataTableProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sorting: SortingState = useMemo(() => {
    if (currentSort) {
      const [field, direction] = currentSort.split("-");
      return [{ id: field, desc: direction === "desc" }];
    }
    return [];
  }, [currentSort]);

  const handleSortChange = (
    e: React.MouseEvent<HTMLButtonElement>,
    columnId: string
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const currentDirection =
      sorting[0]?.id === columnId && sorting[0]?.desc ? "desc" : "asc";
    const newDirection = currentDirection === "asc" ? "desc" : "asc";

    const currentParams = new URLSearchParams(searchParams?.toString());
    currentParams.set("sort", `${columnId}-${newDirection}`);

    const newUrl = `${pathname}?${currentParams.toString()}`;
    router.push(newUrl, { scroll: false });
  };

  const tableData: TableRowData[] = useMemo(() => {
    const folderRows: TableRowData[] = folders.map((folder) => ({
      type: "folder" as const,
      data: folder,
    }));
    const fileRows: TableRowData[] = files.map((file) => ({
      type: "file" as const,
      data: file,
    }));
    return [...folderRows, ...fileRows];
  }, [folders, files]);

  const columns: ColumnDef<TableRowData>[] = useMemo(
    () => [
      {
        id: "icon",
        header: "",
        cell: ({ row }) => {
          if (row.original.type === "folder") {
            return (
              <div className="thumbnail">
                <Folder size={24} className="text-brand" />
              </div>
            );
          }
          return <Thumbnail extension={row.original.data.extension} />;
        },
        enableSorting: false,
        size: 60,
      },
      {
        id: "name",
        accessorFn: (row) => row.data.name,
        header: () => (
          <button
            type="button"
            onClick={(e) => handleSortChange(e, "name")}
            className="flex items-center gap-2 hover:text-light-100"
          >
            Name
            {sorting[0]?.id === "name" && (
              <span className="sort-indicator">
                {sorting[0].desc ? (
                  <ArrowDownAZ size={14} />
                ) : (
                  <ArrowUpZA size={14} />
                )}
              </span>
            )}
          </button>
        ),
        cell: ({ row }) => {
          if (row.original.type === "folder") {
            return (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push(`/${row.original.data.id}`);
                }}
                className=" w-full text-left"
              >
                <p className="subtitle-2 text-light-100 transition-colors hover:text-brand">
                  {row.original.data.name}
                </p>
              </button>
            );
          }
          return (
            <Link
              href={`documents/${row.original.data.id}?title=${row.original.data.name}`}
              target="_blank"
              className="block w-full min-w-0 text-left"
            >
              <p className="subtitle-2 truncate text-light-100 transition-colors hover:text-brand">
                {row.original.data.name}
              </p>
            </Link>
          );
        },
      },
      {
        id: "type",
        accessorFn: (row) => row.type,
        header: "Type",
        cell: ({ row }) => {
          if (row.original.type === "folder") {
            return <span className="caption">Folder</span>;
          }
          return <span>{getFileTypeName(row.original.data.type)}</span>;
        },
        enableSorting: false,
      },
      {
        id: "size",
        accessorFn: (row) => (row.type === "file" ? row.data.size : 0),
        header: () => (
          <button
            type="button"
            onClick={(e) => handleSortChange(e, "size")}
            className="hidden items-center gap-2 hover:text-light-100  sm:flex "
          >
            Size
            {sorting[0]?.id === "size" && (
              <span className="sort-indicator">
                {sorting[0].desc ? (
                  <ArrowDown10 size={14} />
                ) : (
                  <ArrowUp10 size={14} />
                )}
              </span>
            )}
          </button>
        ),
        cell: ({ row }) => {
          if (row.original.type === "folder")
            return <span className="text-light-200">-</span>;
          return (
            <span className="text-light-200">
              {row.original.data.size
                ? convertFileSize(row.original.data.size)
                : "-"}
            </span>
          );
        },
      },
      {
        id: "createdAt",
        accessorFn: (row) => row.data.createdAt,
        header: () => (
          <button
            type="button"
            onClick={(e) => handleSortChange(e, "createdAt")}
            className="hidden items-center gap-2 hover:text-light-100 sm:flex "
          >
            Modified
            {sorting[0]?.id === "createdAt" && (
              <span className="sort-indicator">
                {sorting[0].desc ? (
                  <MoveDown size={14} />
                ) : (
                  <MoveUp size={14} />
                )}
              </span>
            )}
          </button>
        ),
        cell: ({ row }) => (
          <FormattedDateTime
            date={row.original.data.createdAt || ""}
            className="text-light-200"
          />
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="justify-end">
            <ActionDropdown
              item={row.original.data}
              type={row.original.type === "folder" ? "folder" : "file"}
            />
          </div>
        ),
        enableSorting: false,
        size: 60,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sorting, router, pathname]
  );

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
    manualSorting: true,
  });

  if (tableData.length === 0) {
    return <p className="h3 empty-list mt-5">{emptyMessage}</p>;
  }

  return (
    <div className="mt-5 sm:overflow-hidden">
      <Table className="data-table">
        <TableHeader className="hidden sm:table-header-group">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  style={{ width: header.column.getSize() }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              className="
        mt-4 block rounded-[8px] border-2 border-light-300 bg-white p-4
        sm:table-row sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none
      "
            >
              <td className="grid grid-cols-[40px_1fr_20px] gap-x-4 gap-y-1 sm:hidden">
                <div className="row-span-full shrink-0">
                  {flexRender(
                    row.getVisibleCells()[0].column.columnDef.cell,
                    row.getVisibleCells()[0].getContext()
                  )}
                </div>

                <div className="flex min-w-0 flex-col gap-2">
                  {row
                    .getVisibleCells()
                    .slice(1)
                    .map((cell) => {
                      if (cell.column.id === "actions") return null;

                      const isType = cell.column.id === "type";
                      const isFolder = cell.getValue() === "file";

                      return (
                        <div
                          key={cell.id}
                          className={
                            isType
                              ? `inline-flex w-fit items-center rounded-[8px] ${isFolder ? "bg-orange" : "bg-green"} px-2 py-1 text-white`
                              : "truncate text-sm text-light-100"
                          }
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </div>
                      );
                    })}
                </div>

                <div className="shrink-0">
                  {flexRender(
                    row.getVisibleCells()[5].column.columnDef.cell,
                    row.getVisibleCells()[5].getContext()
                  )}
                </div>
              </td>

              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="hidden sm:table-cell">
                  {cell.column.id === "type" ? (
                    <span
                      className={`w-fit items-center rounded-[8px] ${cell.getValue() === "folder" ? "bg-orange" : "bg-green"} px-2 py-1 text-xs font-medium text-white sm:inline-flex`}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </span>
                  ) : (
                    flexRender(cell.column.columnDef.cell, cell.getContext())
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default DataTable;
