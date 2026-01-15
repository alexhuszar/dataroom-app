import { fileStorage } from "./fileStorage";

const mockRequest = <T>(result: T): IDBRequest<T> => {
  const req = {} as IDBRequest<T>;
  setTimeout(() => {
    (req as { result: T }).result = result;
    req.onsuccess?.({ target: { result } } as unknown as Event);
  }, 0);
  return req;
};

const mockObjectStore = {
  put: jest.fn(),
  get: jest.fn(),
  delete: jest.fn(),
  getAll: jest.fn(),
};

const mockTransaction = {
  objectStore: jest.fn(() => mockObjectStore),
};

const mockDB = {
  transaction: jest.fn(() => mockTransaction),
  objectStoreNames: {
    contains: jest.fn().mockReturnValue(false),
  },
  createObjectStore: jest.fn(),
};

const createMockOpenRequest = () => {
  const req = {
    result: mockDB,
    error: null,
    onsuccess: null as ((ev: Event) => void) | null,
    onerror: null as ((ev: Event) => void) | null,
    onupgradeneeded: null as ((ev: IDBVersionChangeEvent) => void) | null,
  };
  return req;
};

let currentOpenRequest: ReturnType<typeof createMockOpenRequest>;

beforeAll(() => {
  currentOpenRequest = createMockOpenRequest();

  Object.defineProperty(global, "indexedDB", {
    value: {
      open: jest.fn(() => currentOpenRequest),
    },
    writable: true,
    configurable: true,
  });

  Object.defineProperty(global.URL, "createObjectURL", {
    value: jest.fn(() => "blob:url"),
    writable: true,
    configurable: true,
  });
});

afterAll(() => {
  // @ts-expect-error - cleanup mock
  delete global.URL.createObjectURL;
});

beforeEach(async () => {
  jest.clearAllMocks();

  (fileStorage as unknown as { db: IDBDatabase | null }).db = null;

  currentOpenRequest = createMockOpenRequest();
  (global.indexedDB.open as jest.Mock).mockImplementation(
    () => currentOpenRequest
  );

  mockDB.objectStoreNames.contains.mockReturnValue(false);

  const initPromise = fileStorage.init();

  currentOpenRequest.onupgradeneeded?.({
    target: { result: mockDB },
  } as unknown as IDBVersionChangeEvent);

  currentOpenRequest.onsuccess?.({
    target: { result: mockDB },
  } as unknown as Event);

  await initPromise;
});

describe("FileStorageService", () => {
  describe("init()", () => {
    it("initializes IndexedDB and creates store on upgrade", async () => {
      (fileStorage as unknown as { db: IDBDatabase | null }).db = null;
      currentOpenRequest = createMockOpenRequest();
      (global.indexedDB.open as jest.Mock).mockImplementation(
        () => currentOpenRequest
      );

      const initPromise = fileStorage.init();

      currentOpenRequest.onupgradeneeded?.({
        target: { result: mockDB },
      } as unknown as IDBVersionChangeEvent);

      currentOpenRequest.onsuccess?.({
        target: { result: mockDB },
      } as unknown as Event);

      await expect(initPromise).resolves.toBeUndefined();

      expect(mockDB.createObjectStore).toHaveBeenCalledWith("fileBlobs", {
        keyPath: "id",
      });
    });
  });

  describe("getDB()", () => {
    it("throws if IndexedDB is not supported", async () => {
      const original = global.indexedDB;
      // @ts-expect-error - intentionally deleting for test
      delete global.indexedDB;

      (fileStorage as unknown as { db: IDBDatabase | null }).db = null;

      await expect(
        // @ts-expect-error – private method test
        fileStorage.getDB()
      ).rejects.toThrow("IndexedDB not supported");

      global.indexedDB = original;
    });
  });

  describe("storeFile()", () => {
    it("stores a file record", async () => {
      mockObjectStore.put.mockReturnValue(mockRequest(undefined));

      const file = new File(["hello"], "test.txt", {
        type: "text/plain",
      });

      await fileStorage.storeFile("file-1", file);

      expect(mockObjectStore.put).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "file-1",
          name: "test.txt",
          size: file.size,
          type: "text/plain",
          blob: file,
          uploadedAt: expect.any(String),
        })
      );
    });
  });

  describe("getFile()", () => {
    it("retrieves a stored file", async () => {
      const storedFile = {
        id: "file-1",
        blob: new Blob(["hello"]),
        name: "test.txt",
        size: 5,
        type: "text/plain",
        uploadedAt: "now",
      };

      mockObjectStore.get.mockReturnValue(mockRequest(storedFile));

      const result = await fileStorage.getFile("file-1");

      expect(mockObjectStore.get).toHaveBeenCalledWith("file-1");
      expect(result).toEqual(storedFile);
    });
  });

  describe("deleteFile()", () => {
    it("deletes a file", async () => {
      mockObjectStore.delete.mockReturnValue(mockRequest(undefined));

      await fileStorage.deleteFile("file-1");

      expect(mockObjectStore.delete).toHaveBeenCalledWith("file-1");
    });
  });

  describe("getFileUrl()", () => {
    it("returns object URL when file exists", async () => {
      const blob = new Blob(["hello"]);
      mockObjectStore.get.mockReturnValue(
        mockRequest({
          id: "file-1",
          blob,
          name: "test.txt",
          size: 5,
          type: "text/plain",
          uploadedAt: "now",
        })
      );

      const url = await fileStorage.getFileUrl("file-1");

      expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
      expect(url).toBe("blob:url");
    });

    it("returns null when file does not exist", async () => {
      mockObjectStore.get.mockReturnValue(mockRequest(undefined));

      const url = await fileStorage.getFileUrl("missing");

      expect(url).toBeNull();
      expect(URL.createObjectURL).not.toHaveBeenCalled();
    });
  });

  describe("getAllFiles()", () => {
    it("returns all stored files", async () => {
      const files = [
        { id: "1", name: "a.txt" },
        { id: "2", name: "b.txt" },
      ];

      mockObjectStore.getAll.mockReturnValue(mockRequest(files));

      const result = await fileStorage.getAllFiles();

      expect(mockObjectStore.getAll).toHaveBeenCalled();
      expect(result).toEqual(files);
    });
  });
});
