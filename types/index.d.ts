declare type FileType = "document" | "other";

declare interface ActionType {
  label: string;
  icon: ReacNode;
  value: string;
}

declare interface SearchParamProps {
  params?: Promise<SegmentParams>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

declare interface UploadFileProps {
  file: File;
  ownerId: string;
  accountId: string;
  path: string;
  parentId?: string | null;
}
declare interface GetFilesProps {
  types: FileType[];
  searchText?: string;
  sort?: string;
  limit?: number;
}
declare interface RenameFileProps {
  fileId: string;
  name: string;
  extension: string;
  path: string;
}
declare interface DeleteFileProps {
  fileId: string;
  bucketFileId: string;
  path: string;
}

declare interface FileUploaderProps {
  ownerId: string;
  accountId: string;
  className?: string;
}

declare interface MobileNavigationProps {
  ownerId: string;
  accountId: string;
  fullName: string;
  email: string;
}
declare interface SidebarProps {
  fullName: string;
  email: string;
}

declare interface ThumbnailProps {
  type: string;
  extension: string;
  url: string;
  className?: string;
  imageClassName?: string;
}

declare interface FileDocumentType {
  id: string;
  type: FileType;
  name: string;
  url: string;
  extension: string;
  size: number;
  owner: string;
  accountId: string;
  bucketFileId: string;
  parentId: string | null;
  createdAt?: string;
  updatedAt?: string;
  $id?: string;
}

declare interface FolderDocumentType {
  id: string;
  name: string;
  parentId: string | null;
  owner: string;
  accountId: string;
  createdAt?: string;
  updatedAt?: string;
  $id?: string;
}

declare interface BreadcrumbItem {
  id: string | null;
  name: string;
  url: string;
}

declare interface FolderContents {
  folders: FolderDocumentType[];
  files: FileDocumentType[];
}

declare interface CreateFolderProps {
  name: string;
  parentId: string | null;
  ownerId: string;
  accountId: string;
  path: string;
}

declare interface RenameFolderProps {
  folderId: string;
  name: string;
  path: string;
}

declare interface MoveFolderProps {
  folderId: string;
  targetParentId: string | null;
  path: string;
}

declare interface DeleteFolderProps {
  folderId: string;
  path: string;
}

declare interface MoveFileProps {
  fileId: string;
  targetParentId: string | null;
  path: string;
}
