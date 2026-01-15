export const createMockFolder = (overrides: Partial<FolderDocumentType> = {}): FolderDocumentType => ({
  id: 'folder-1',
  name: 'Test Folder',
  createdAt: '2024-01-01T00:00:00Z',
  parentId: null,
  owner: 'user-1',
  accountId: 'account-1',
  ...overrides,
})

export const createMockFile = (overrides: Partial<FileDocumentType> = {}): FileDocumentType => ({
  id: 'file-1',
  name: 'document.pdf',
  extension: '.pdf',
  type: 'document',
  size: 1024,
  createdAt: '2024-01-02T00:00:00Z',
  url: 'https://example.com/file.pdf',
  owner: 'user-1',
  accountId: 'account-1',
  bucketFileId: 'bucket-1',
  parentId: 'folder-1',
  ...overrides,
})