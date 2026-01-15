import React from "react";
import { render, screen } from "@testing-library/react";
import { DataTable } from "./DataTable";
import {
  createMockFile,
  createMockFolder,
} from "@/lib/utils-test/mocks-override";

jest.mock("@/lib/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "test-user", name: "Test User" },
    isLoading: false,
    isAuthenticated: true,
    signUp: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    getCurrentUser: () => ({ id: "test-user", name: "Test User" }),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

jest.mock("@/lib/contexts/FileContext", () => ({
  useFile: () => ({
    files: [createMockFile()],
    isLoading: false,
    uploadFile: jest.fn(),
    getFiles: jest.fn(),
    renameFile: jest.fn(),
    deleteFile: jest.fn(),
    moveFile: jest.fn(),
    refreshFiles: jest.fn(),
    clearFiles: jest.fn(),
  }),
}));

jest.mock("@/lib/contexts/ShareContext", () => ({
  useShare: () => ({
    sharedFiles: [createMockFile({ name: "file.pdf" })],
    myShares: [createMockFile({ name: "my-sharefile.pdf" })],
    isLoading: false,
    shareFile: jest.fn(),
    getSharedWithMe: jest.fn(),
    getFileShares: jest.fn(),
    revokeShare: jest.fn(),
    refreshSharedFiles: jest.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

jest.mock("@/lib/contexts/FolderContext", () => ({
  useFolder: () => ({
    folders: [createMockFile()],
    isLoading: false,
    createFolder: jest.fn(),
    getFolders: jest.fn(),
    renameFolder: jest.fn(),
    moveFolder: jest.fn(),
    deleteFolder: jest.fn(),
    clearFolders: jest.fn(),
  }),
}));

jest.mock("@/components/ActionDropdown", () => ({
  ActionDropdown: () => <div data-testid="action-dropdown">Actions</div>,
}));

jest.mock("@/components/Thumbnail", () => ({
  Thumbnail: ({ extension }: { extension: string }) => (
    <figure className="thumbnail" data-testid="thumbnail">
      <span data-testid={`file-${extension}`} />
    </figure>
  ),
}));

jest.mock("@/components/FormattedDateTime", () => ({
  FormattedDateTime: ({ date, className }: { date: string; className?: string }) => (
    <span className={className} data-testid="formatted-date">{date}</span>
  ),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  usePathname: () => "/test",
  useSearchParams: () => ({
    get: () => null,
    toString: () => "",
  }),
}));

jest.mock("lucide-react", () => ({
  ArrowDown10: () => <span data-testid="arrow-down-10" />,
  ArrowDownAZ: () => <span data-testid="arrow-down-az" />,
  ArrowUp10: () => <span data-testid="arrow-up-10" />,
  ArrowUpZA: () => <span data-testid="arrow-up-za" />,
  Folder: () => <span data-testid="folder-icon" />,
  File: () => <span data-testid="file-icon" />,
  FileText: () => <span data-testid="file-text-icon" />,
  MoveDown: () => <span data-testid="move-down" />,
  MoveUp: () => <span data-testid="move-up" />,
  Pen: () => <span data-testid="pen" />,
  Move: () => <span data-testid="move" />,
  Trash: () => <span data-testid="trash" />,
  EllipsisVertical: () => <span data-testid="ellipsis-vertical" />,
}));

jest.mock("@/components/ui/table", () => ({
  Table: ({ children }: { children: React.ReactNode }) => (
    <table data-testid="table">{children}</table>
  ),
  TableBody: ({ children }: { children: React.ReactNode }) => (
    <tbody>{children}</tbody>
  ),
  TableCell: ({ children }: { children: React.ReactNode }) => (
    <td>{children}</td>
  ),
  TableHead: ({ children }: { children: React.ReactNode }) => (
    <th>{children}</th>
  ),
  TableHeader: ({ children }: { children: React.ReactNode }) => (
    <thead>{children}</thead>
  ),
  TableRow: ({ children }: { children: React.ReactNode }) => (
    <tr>{children}</tr>
  ),
}));

describe("DataTable", () => {
  const mockFolders: FolderDocumentType[] = [
    createMockFolder({
      id: "folder-1",
      name: "Test Folder",
    }),
  ];

  const mockFiles: FileDocumentType[] = [
    createMockFile({
      id: "file-1",
      name: "document.pdf",
      extension: "pdf",
    }),
    createMockFile({
      id: "file-2",
      name: "image.png",
      extension: "png",
      type: "other",
      size: 2048,
    }),
  ];

  describe("Basic Functionality", () => {
    it("shows empty message when no data", () => {
      render(<DataTable folders={[]} files={[]} />);
      expect(
        screen.getByText("No files or folders found!")
      ).toBeInTheDocument();
    });

    it("shows custom empty message", () => {
      render(
        <DataTable folders={[]} files={[]} emptyMessage="Custom message" />
      );
      expect(screen.getByText("Custom message")).toBeInTheDocument();
    });

    it("renders folders and files", () => {
      render(<DataTable folders={mockFolders} files={mockFiles} />);
      expect(screen.getAllByText("Test Folder").length).toBeGreaterThan(0);
      expect(screen.getAllByText("document.pdf").length).toBeGreaterThan(0);
      expect(screen.getAllByText("image.png").length).toBeGreaterThan(0);
    });
  });

  describe("File Type Display", () => {
    it('shows "Folder" for folders', () => {
      render(<DataTable folders={mockFolders} files={[]} />);
      expect(screen.getAllByText("Folder").length).toBeGreaterThan(0);
    });

    it('shows "Document" for document files', () => {
      render(<DataTable folders={[]} files={[mockFiles[0]]} />);
      expect(screen.getAllByText("Document").length).toBeGreaterThan(0);
    });

    it('shows "Other" for other file types', () => {
      render(<DataTable folders={[]} files={[mockFiles[1]]} />);
      expect(screen.getAllByText("Other").length).toBeGreaterThan(0);
    });
  });

  describe("PDF File Handling", () => {
    it("enables PDF file buttons", () => {
      const pdfFile = createMockFile({
        name: "document.pdf",
        extension: "pdf",
      });
      render(<DataTable folders={[]} files={[pdfFile]} />);
      const pdfButtons = screen.getAllByText("document.pdf");
      expect(pdfButtons[0]).not.toBeDisabled();
    });

    it("disables non-PDF file buttons", () => {
      const nonPdfFile = createMockFile({
        name: "document.txt",
        extension: "txt",
      });
      render(<DataTable folders={[]} files={[nonPdfFile]} />);
      const fileButtons = screen.getAllByText("document.txt");
      expect(fileButtons[0]).toBeDisabled();
    });
  });

  describe("Edge Cases", () => {
    it("handles missing file size", () => {
      const fileWithoutSize = createMockFile({
        size: undefined,
      });
      render(<DataTable folders={[]} files={[fileWithoutSize]} />);
      expect(screen.getAllByText("document.pdf").length).toBeGreaterThan(0);
    });

    it("handles large number of items", () => {
      const manyFiles = Array.from({ length: 20 }, (_, i) =>
        createMockFile({
          id: `file-${i}`,
          name: `file-${i}.pdf`,
        })
      );
      render(<DataTable folders={[]} files={manyFiles} />);
      expect(screen.getByTestId("table")).toBeInTheDocument();
    });

    it("handles null/undefined values gracefully", () => {
      const fileWithNullSize = createMockFile({
        size: undefined,
      });
      render(<DataTable folders={[]} files={[fileWithNullSize]} />);
      expect(screen.getAllByText("document.pdf").length).toBeGreaterThan(0);
    });
  });
});
