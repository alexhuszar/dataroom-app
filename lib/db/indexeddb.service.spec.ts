import { db, STORES } from "./indexeddb";
import { generateId } from "../utils/general";
import { withTimestamps, updateTimestamp } from "../utils/date";


jest.mock("../utils/general", () => ({
  generateId: jest.fn(),
}));

jest.mock("../utils/date", () => ({
  withTimestamps: jest.fn(),
  updateTimestamp: jest.fn(),
}));


const mockRequest = <T>(result: T): IDBRequest<T> => {
  const req = {} as IDBRequest<T>;
  setTimeout(() => {
    (req as { result: T }).result = result;
    req.onsuccess?.({ target: { result } } as unknown as Event);
  }, 0);
  return req;
};

const mockObjectStore = {
  add: jest.fn(),
  get: jest.fn(),
  getAll: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  index: jest.fn(),
};

const mockTransaction = {
  objectStore: jest.fn(() => mockObjectStore),
};

const mockDB = {
  transaction: jest.fn(() => mockTransaction),
};

const createMockOpenRequest = () => {
  const req = {
    result: mockDB,
    error: null,
    onsuccess: null as ((ev: Event) => void) | null,
    onerror: null as ((ev: Event) => void) | null,
    onupgradeneeded: null as ((ev: IDBVersionChangeEvent) => void) | null,
  };
  setTimeout(() => {
    req.onsuccess?.({ target: { result: mockDB } } as unknown as Event);
  }, 0);
  return req as unknown as IDBOpenDBRequest;
};

beforeAll(() => {
  Object.defineProperty(global, "indexedDB", {
    value: {
      open: jest.fn(() => createMockOpenRequest()),
    },
    writable: true,
    configurable: true,
  });
});


beforeEach(async () => {
  jest.clearAllMocks();

  // Reset the db instance
  (db as unknown as { db: IDBDatabase | null }).db = null;

  // Recreate mock open request for each test
  (global.indexedDB.open as jest.Mock).mockImplementation(() => createMockOpenRequest());

  (generateId as jest.Mock).mockReturnValue("generated-id");
  (withTimestamps as jest.Mock).mockImplementation(v => ({
    ...v,
    createdAt: "now",
    updatedAt: "now",
  }));
  (updateTimestamp as jest.Mock).mockImplementation(v => ({
    ...v,
    updatedAt: "updated",
  }));

  // Pre-initialize the db for tests that need it
  await db.init();
});


describe("IndexedDBService", () => {
  describe("init()", () => {
    it("initializes database successfully", async () => {
      // Reset and test fresh init
      (db as unknown as { db: IDBDatabase | null }).db = null;
      await expect(db.init()).resolves.toBeUndefined();
    });
  });

  describe("getDB()", () => {
    it("throws when IndexedDB is not supported", async () => {
      const original = global.indexedDB;
      // @ts-expect-error - intentionally deleting for test
      delete global.indexedDB;

      // Reset db so it tries to access indexedDB
      (db as unknown as { db: IDBDatabase | null }).db = null;

      await expect((db as unknown as { getDB: () => Promise<IDBDatabase> }).getDB()).rejects.toThrow(
        "IndexedDB not supported"
      );

      global.indexedDB = original;
    });
  });

  describe("CRUD operations", () => {
    it("adds data to store", async () => {
      mockObjectStore.add.mockReturnValue(mockRequest("id"));

      const result = await db.add(STORES.USERS, { id: "1" });

      expect(mockObjectStore.add).toHaveBeenCalled();
      expect(result).toBe("id");
    });

    it("gets data by id", async () => {
      mockObjectStore.get.mockReturnValue(mockRequest({ id: "1" }));

      const result = await db.get(STORES.USERS, "1");

      expect(mockObjectStore.get).toHaveBeenCalledWith("1");
      expect(result).toEqual({ id: "1" });
    });

    it("updates data", async () => {
      mockObjectStore.put.mockReturnValue(mockRequest(undefined));

      await db.update(STORES.USERS, { id: "1" });

      expect(mockObjectStore.put).toHaveBeenCalled();
    });

    it("deletes data", async () => {
      mockObjectStore.delete.mockReturnValue(mockRequest(undefined));

      await db.delete(STORES.USERS, "1");

      expect(mockObjectStore.delete).toHaveBeenCalledWith("1");
    });
  });

  describe("Index-based queries", () => {
    it("gets by index", async () => {
      const getAll = jest.fn(() => mockRequest([{ id: "1" }]));
      mockObjectStore.index.mockReturnValue({ getAll });

      const result = await db.getByIndex(
        STORES.USERS,
        "email",
        "test@mail.com"
      );

      expect(mockObjectStore.index).toHaveBeenCalledWith("email");
      expect(result).toEqual([{ id: "1" }]);
    });
  });

  describe("User operations", () => {
    it("creates a user with timestamps and generated id", async () => {
      mockObjectStore.add.mockReturnValue(mockRequest(undefined));

      const user = await db.createUser({
        email: "test@mail.com",
        name: "Test",
        provider: "credentials",
        accountId: "test@mail.com",
      });

      expect(generateId).toHaveBeenCalled();
      expect(withTimestamps).toHaveBeenCalled();
      expect(user.id).toBe("generated-id");
    });

    it("updates user password", async () => {
      mockObjectStore.get.mockReturnValue(
        mockRequest({ id: "1", email: "x" })
      );
      mockObjectStore.put.mockReturnValue(mockRequest(undefined));

      await db.updateUserPassword("1", "hash");

      expect(updateTimestamp).toHaveBeenCalled();
      expect(mockObjectStore.put).toHaveBeenCalled();
    });

    it("does nothing if user not found", async () => {
      mockObjectStore.get.mockReturnValue(mockRequest(undefined));

      await db.updateUserPassword("1", "hash");

      expect(mockObjectStore.put).not.toHaveBeenCalled();
    });
  });

  describe("Session operations", () => {
    it("creates session", async () => {
      mockObjectStore.add.mockReturnValue(mockRequest(undefined));

      const session = await db.createSession({
        sessionToken: "token",
        userId: "1",
        expires: new Date(),
      });

      expect(session.id).toBe("generated-id");
    });

    it("clears expired sessions", async () => {
      const now = new Date();

      mockObjectStore.getAll.mockReturnValue(
        mockRequest([
          { id: "1", expires: new Date(now.getTime() - 1000) },
          { id: "2", expires: new Date(now.getTime() + 1000) },
        ])
      );

      mockObjectStore.delete.mockReturnValue(mockRequest(undefined));

      await db.clearExpiredSessions();

      expect(mockObjectStore.delete).toHaveBeenCalledTimes(1);
      expect(mockObjectStore.delete).toHaveBeenCalledWith("1");
    });
  });

  describe("Shares queries", () => {
    it("gets shares by file id", async () => {
      const getAll = jest.fn(() => mockRequest([{ id: "share1" }]));
      mockObjectStore.index.mockReturnValue({ getAll });

      const result = await db.getSharesByFileId("file1");

      expect(result).toEqual([{ id: "share1" }]);
    });
  });
});
