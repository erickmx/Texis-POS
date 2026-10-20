import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { AttachmentsGrid } from "@/components/special-requests/drawer/AttachmentsGrid";
import {
  uploadOrderAttachment,
  deleteOrderAttachment,
} from "@/lib/api/specialRequests";
import toast from "react-hot-toast";

jest.mock("@/i18n/client", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

jest.mock("@/lib/api/specialRequests", () => ({
  uploadOrderAttachment: jest.fn(),
  deleteOrderAttachment: jest.fn(),
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { error: jest.fn(), success: jest.fn() },
}));

const mockUpload = uploadOrderAttachment as jest.Mock;
const mockDelete = deleteOrderAttachment as jest.Mock;

const URL_1 =
  "https://proj.supabase.co/storage/v1/object/public/inventory-images/a.png";

describe("AttachmentsGrid", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should stay read-only without an orderId (no controls).", () => {
    render(<AttachmentsGrid attachments={[URL_1]} lng="en" />);
    expect(screen.getByTestId("attachments-grid")).toBeInTheDocument();
    expect(screen.queryByTestId("attachments-add")).not.toBeInTheDocument();
    expect(screen.queryByTestId("attachment-delete")).not.toBeInTheDocument();
  });

  it("should upload added files and revalidate via onChanged.", async () => {
    mockUpload.mockResolvedValue({ url: URL_1 });
    const onChanged = jest.fn().mockResolvedValue(undefined);
    render(
      <AttachmentsGrid
        attachments={[]}
        lng="en"
        orderId="uuid-1"
        onChanged={onChanged}
      />,
    );

    const file = new File(["img"], "photo.png", { type: "image/png" });
    const input = screen.getByTestId("attachments-file-input");
    Object.defineProperty(input, "files", {
      value: [file],
      configurable: true,
    });
    fireEvent.change(input);

    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalledWith("uuid-1", file);
    });
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
  });

  it("should require two steps to delete: arm then confirm.", async () => {
    mockDelete.mockResolvedValue({ deleted: true });
    const onChanged = jest.fn().mockResolvedValue(undefined);
    render(
      <AttachmentsGrid
        attachments={[URL_1]}
        lng="en"
        orderId="uuid-1"
        onChanged={onChanged}
      />,
    );

    // First click only arms — no API call yet.
    fireEvent.click(screen.getByTestId("attachment-delete"));
    expect(mockDelete).not.toHaveBeenCalled();
    const confirm = screen.getByTestId("attachment-confirm");

    // Second click confirms — hard-delete + revalidate.
    fireEvent.click(confirm);
    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith("uuid-1", URL_1);
    });
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
  });

  it("should keep the thumbnail and toast when the delete fails.", async () => {
    mockDelete.mockRejectedValue(new Error("network"));
    const onChanged = jest.fn().mockResolvedValue(undefined);
    render(
      <AttachmentsGrid
        attachments={[URL_1]}
        lng="en"
        orderId="uuid-1"
        onChanged={onChanged}
      />,
    );

    fireEvent.click(screen.getByTestId("attachment-delete"));
    fireEvent.click(screen.getByTestId("attachment-confirm"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "specialRequests.drawer.attachments.deleteFailed",
      );
    });
    expect(screen.getByTestId("attachments-grid")).toBeInTheDocument();
    expect(onChanged).not.toHaveBeenCalled();
  });

  it("should toast and skip onChanged when an upload fails.", async () => {
    mockUpload.mockRejectedValue(new Error("network"));
    const onChanged = jest.fn().mockResolvedValue(undefined);
    render(
      <AttachmentsGrid
        attachments={[]}
        lng="en"
        orderId="uuid-1"
        onChanged={onChanged}
      />,
    );

    const file = new File(["img"], "photo.png", { type: "image/png" });
    const input = screen.getByTestId("attachments-file-input");
    Object.defineProperty(input, "files", {
      value: [file],
      configurable: true,
    });
    fireEvent.change(input);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "specialRequests.newRequestForm.attachments.failed",
      );
    });
    expect(onChanged).not.toHaveBeenCalled();
  });
});
