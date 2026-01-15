import { renderHook, waitFor } from "@testing-library/react";
import { useIndexedDBSync } from "./useIndexedDBSync";
import { useSession } from "next-auth/react";
import { db } from "@/lib/db/indexeddb";

jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
}));

jest.mock("@/lib/db/indexeddb", () => ({
  db: {
    init: jest.fn(),
    getUserByEmail: jest.fn(),
    add: jest.fn(),
  },
  STORES: {
    USERS: "users",
  },
}));

const authenticatedSession = {
  status: "authenticated",
  data: {
    user: {
      id: "server-generated-uuid",
      email: "test@mail.com",
      name: "Test User",
      provider: "credentials",
    },
  },
};

const unauthenticatedSession = {
  status: "unauthenticated",
  data: null,
};

describe("useIndexedDBSync", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does nothing when user is not authenticated", async () => {
    (useSession as jest.Mock).mockReturnValue(unauthenticatedSession);

    renderHook(() => useIndexedDBSync());

    await waitFor(() => {
      expect(db.init).not.toHaveBeenCalled();
      expect(db.getUserByEmail).not.toHaveBeenCalled();
      expect(db.add).not.toHaveBeenCalled();
    });
  });

  it("does nothing when email is missing", async () => {
    (useSession as jest.Mock).mockReturnValue({
      status: "authenticated",
      data: {
        user: {
          email: null,
          name: "Test User",
          provider: "credentials",
        },
      },
    });

    renderHook(() => useIndexedDBSync());

    await waitFor(() => {
      expect(db.init).not.toHaveBeenCalled();
    });
  });

  it("initializes DB and creates user when not existing", async () => {
    jest.spyOn(console, "log").mockImplementation(() => {});

    (useSession as jest.Mock).mockReturnValue(authenticatedSession);
    (db.init as jest.Mock).mockResolvedValue(undefined);
    (db.getUserByEmail as jest.Mock).mockResolvedValue(null);
    (db.add as jest.Mock).mockResolvedValue(undefined);

    renderHook(() => useIndexedDBSync());

    await waitFor(() => {
      expect(db.init).toHaveBeenCalled();
      expect(db.getUserByEmail).toHaveBeenCalledWith("test@mail.com");
      expect(db.add).toHaveBeenCalledWith(
        "users",
        expect.objectContaining({
          id: "server-generated-uuid",
          email: "test@mail.com",
          name: "Test User",
          provider: "credentials",
          accountId: "test@mail.com",
        })
      );
    });

    expect(console.log).toHaveBeenCalledWith(
      "User synced to IndexedDB:",
      "test@mail.com"
    );
  });

  it("does not create user when already exists", async () => {
    (useSession as jest.Mock).mockReturnValue(authenticatedSession);
    (db.init as jest.Mock).mockResolvedValue(undefined);
    (db.getUserByEmail as jest.Mock).mockResolvedValue({
      email: "test@mail.com",
    });

    renderHook(() => useIndexedDBSync());

    await waitFor(() => {
      expect(db.init).toHaveBeenCalled();
      expect(db.getUserByEmail).toHaveBeenCalled();
      expect(db.add).not.toHaveBeenCalled();
    });
  });

  it("logs error when db.init fails", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});

    (useSession as jest.Mock).mockReturnValue(authenticatedSession);
    (db.init as jest.Mock).mockRejectedValue(new Error("Init failed"));

    renderHook(() => useIndexedDBSync());

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        "Failed to sync user to IndexedDB:",
        expect.any(Error)
      );
    });
  });

  it("logs error when getUserByEmail fails", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});

    (useSession as jest.Mock).mockReturnValue(authenticatedSession);
    (db.init as jest.Mock).mockResolvedValue(undefined);
    (db.getUserByEmail as jest.Mock).mockRejectedValue(
      new Error("Read failed")
    );

    renderHook(() => useIndexedDBSync());

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        "Failed to sync user to IndexedDB:",
        expect.any(Error)
      );
    });
  });

  it("logs error when db.add fails", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});

    (useSession as jest.Mock).mockReturnValue(authenticatedSession);
    (db.init as jest.Mock).mockResolvedValue(undefined);
    (db.getUserByEmail as jest.Mock).mockResolvedValue(null);
    (db.add as jest.Mock).mockRejectedValue(
      new Error("Add failed")
    );

    renderHook(() => useIndexedDBSync());

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        "Failed to sync user to IndexedDB:",
        expect.any(Error)
      );
    });
  });
});
