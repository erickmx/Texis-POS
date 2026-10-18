import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { CreateForm } from "@/components/special-requests/drawer/CreateForm";
import { uploadImage } from "@/lib/api/storage";
import { createSpecialRequest } from "@/lib/api/specialRequests";
import toast from "react-hot-toast";

jest.mock("@/i18n/client", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

jest.mock("@/lib/api/storage", () => ({
  uploadImage: jest.fn(),
}));

jest.mock("@/lib/api/specialRequests", () => ({
  createSpecialRequest: jest.fn(),
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { error: jest.fn(), success: jest.fn() },
}));

const mockUpload = uploadImage as jest.Mock;
const mockCreate = createSpecialRequest as jest.Mock;

const LABELS = {
  customer: "specialRequests.newRequestForm.fields.customerName",
  gasto: "specialRequests.newRequestForm.fields.gastoTerceros",
  service: "specialRequests.newRequestForm.fields.serviceFee",
  progress: "specialRequests.newRequestForm.fields.progressPct",
};

function addFiles(count: number) {
  const input = screen.getByTestId("create-file-input");
  const files = Array.from({ length: count }, (_, i) =>
    new File(["img"], `photo-${i}.png`, { type: "image/png" }),
  );
  Object.defineProperty(input, "files", { value: files, configurable: true });
  fireEvent.change(input);
}

describe("CreateForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpload.mockReset();
    mockCreate.mockReset();
  });

  it("should reject an empty customer name and never POST.", async () => {
    const onCreated = jest.fn();
    render(<CreateForm lng="en" onCreated={onCreated} />);

    fireEvent.click(screen.getByTestId("create-submit"));

    await waitFor(() => {
      expect(
        screen.getByText(
          "specialRequests.newRequestForm.errors.customer_required",
        ),
      ).toBeInTheDocument();
    });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("should reject progress 101 with the translated-key message.", async () => {
    render(<CreateForm lng="en" onCreated={jest.fn()} />);

    fireEvent.change(screen.getByLabelText(LABELS.customer), {
      target: { value: "Juan" },
    });
    fireEvent.change(screen.getByLabelText(LABELS.progress), {
      target: { value: "101" },
    });
    fireEvent.click(screen.getByTestId("create-submit"));

    await waitFor(() => {
      expect(
        screen.getByText(
          "specialRequests.newRequestForm.errors.progress_range",
        ),
      ).toBeInTheDocument();
    });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("should upload files before POST and call onCreated on success.", async () => {
    mockUpload
      .mockResolvedValueOnce("https://cdn/u1.png")
      .mockResolvedValueOnce("https://cdn/u2.png");
    mockCreate.mockResolvedValue({ id: "new-id", folio: 7 });
    const onCreated = jest.fn().mockResolvedValue(undefined);
    render(<CreateForm lng="en" onCreated={onCreated} />);

    fireEvent.change(screen.getByLabelText(LABELS.customer), {
      target: { value: "Juan Pérez" },
    });
    addFiles(2);
    fireEvent.click(screen.getByTestId("create-submit"));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_name: "Juan Pérez",
          attachments: ["https://cdn/u1.png", "https://cdn/u2.png"],
        }),
      );
    });
    expect(mockUpload).toHaveBeenCalledTimes(2);
    expect(toast.success).toHaveBeenCalledWith(
      "specialRequests.newRequestForm.success.created",
    );
    expect(onCreated).toHaveBeenCalled();
  });

  it("should block the POST when an upload fails and keep form values.", async () => {
    mockUpload.mockRejectedValue(new Error("network"));
    render(<CreateForm lng="en" onCreated={jest.fn()} />);

    fireEvent.change(screen.getByLabelText(LABELS.customer), {
      target: { value: "Juan" },
    });
    addFiles(1);
    fireEvent.click(screen.getByTestId("create-submit"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "specialRequests.newRequestForm.errors.upload_failed",
      );
    });
    expect(mockCreate).not.toHaveBeenCalled();
    expect(
      (screen.getByLabelText(LABELS.customer) as HTMLInputElement).value,
    ).toBe("Juan");
  });

  it("should keep values and show an error toast when the POST fails.", async () => {
    mockCreate.mockRejectedValue(new Error("server"));
    render(<CreateForm lng="en" onCreated={jest.fn()} />);

    fireEvent.change(screen.getByLabelText(LABELS.customer), {
      target: { value: "María" },
    });
    fireEvent.click(screen.getByTestId("create-submit"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "specialRequests.newRequestForm.errors.create_failed",
      );
    });
    expect(
      (screen.getByLabelText(LABELS.customer) as HTMLInputElement).value,
    ).toBe("María");
  });

  it("should derive the fiscal preview live: IVA on service fee only.", () => {
    render(<CreateForm lng="en" onCreated={jest.fn()} />);

    fireEvent.change(screen.getByLabelText(LABELS.gasto), {
      target: { value: "1200" },
    });
    fireEvent.change(screen.getByLabelText(LABELS.service), {
      target: { value: "450" },
    });

    expect(screen.getByTestId("create-fiscal-iva").textContent).toMatch(/72/);
    expect(screen.getByTestId("create-fiscal-total").textContent).toMatch(
      /1,?\s?722/,
    );
  });
});
