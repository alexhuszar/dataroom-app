import React, { createRef } from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  FileUploader,
  FileUploaderHandle,
  MAX_FILE_SIZE,
} from "./FileUploader";

const toastMock = jest.fn();
const uploadFileMock = jest.fn();

jest.mock("@/lib/hooks/useToast", () => ({
  useToast: () => ({
    toast: toastMock,
  }),
}));

jest.mock("@/lib/contexts/FileContext", () => ({
  useFile: () => ({
    uploadFile: uploadFileMock,
  }),
}));

jest.mock("@/lib/utils/file", () => ({
  getFileType: (name: string) => ({
    extension: name.split(".").pop(),
  }),
}));

jest.mock("@/components/Thumbnail", () => ({
  Thumbnail: ({ extension }: { extension: string }) => (
    <div data-testid="thumbnail">{extension}</div>
  ),
}));

jest.mock("lucide-react", () => ({
  Loader2: () => <div data-testid="loader" />,
}));

const createFile = (name: string, size: number) =>
  new File(["a".repeat(size)], name, { type: "text/plain" });

const renderUploader = () => {
  const ref = createRef<FileUploaderHandle>();

  render(
    <FileUploader
      ref={ref}
      ownerId="owner-1"
      accountId="account-1"
      currentFolderId="folder-1"
    />
  );

  return { ref };
};

const actHandleFiles = async (
  ref: React.RefObject<FileUploaderHandle | null>,
  files: File[]
) => {
  await act(async () => {
    await ref.current?.handleFiles(files);
  });
};

describe("FileUploader", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("exposes openFilePicker via ref and triggers input click", async () => {
    const { ref } = renderUploader();

    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    expect(input).toBeInTheDocument();

    const clickSpy = jest.spyOn(input, "click");

    await act(async () => {
      ref.current?.openFilePicker();
    });

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it("shows toast and skips files larger than MAX_FILE_SIZE", async () => {
    const { ref } = renderUploader();
    const oversizedFile = createFile("large.txt", MAX_FILE_SIZE + 1);

    await actHandleFiles(ref, [oversizedFile]);

    expect(uploadFileMock).not.toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Uploading")).not.toBeInTheDocument();
  });

  it("uploads a valid file and removes preview on success", async () => {
    uploadFileMock.mockResolvedValueOnce(true);

    const { ref } = renderUploader();
    const file = createFile("file.txt", 1000);

    await act(async () => {
      ref.current?.handleFiles([file]);
    });

    expect(uploadFileMock).toHaveBeenCalledWith(
      file,
      "owner-1",
      "account-1",
      "folder-1"
    );

    await waitFor(() => {
      expect(screen.queryByText("file.txt")).not.toBeInTheDocument();
    });
  });

  it("handles file input change and clears input value", async () => {
    uploadFileMock.mockResolvedValueOnce(true);

    renderUploader();

    const input = screen.getByLabelText(/upload files/i) as HTMLInputElement;

    const file = createFile("input.txt", 200);

    await act(async () => {
      fireEvent.change(input, {
        target: {
          files: [file],
        },
      });
    });

    expect(input.value).toBe("");

    await waitFor(() => {
      expect(uploadFileMock).toHaveBeenCalledTimes(1);
    });
  });

  it("does nothing if all files are invalid", async () => {
    const { ref } = renderUploader();

    const invalidFiles = [createFile("too-big.txt", MAX_FILE_SIZE + 100)];

    await actHandleFiles(ref, invalidFiles);

    expect(uploadFileMock).not.toHaveBeenCalled();
    expect(screen.queryByText("Uploading")).not.toBeInTheDocument();
  });

  it("does not render uploader UI when there are no uploads", () => {
    renderUploader();
    expect(screen.queryByText("Uploading")).not.toBeInTheDocument();
  });
});
