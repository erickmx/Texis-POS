import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { RequestDrawer } from "../RequestDrawer";
import {
  RequestDrawerProvider,
  useRequestDrawer,
} from "@/components/providers/RequestDrawerProvider";
import { RequestCard } from "../RequestCard";
import { SpecialOrder } from "@/lib/api/types";
import { updateOrderDetails } from "@/lib/api/specialRequests";
import toast from "react-hot-toast";

jest.mock("@/i18n/client", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const keys: Record<string, string> = {
        "specialRequests.drawer.header.title": "Special request",
        "specialRequests.status.pending": "Pending",
        "specialRequests.urgency.warning": "Upcoming",
        "specialRequests.drawer.fields.title": "Title",
        "specialRequests.drawer.fields.description": "Description",
        "specialRequests.drawer.fields.deadline": "Deadline",
        "specialRequests.drawer.fields.phase": "Phase",
        "specialRequests.drawer.fields.progressPct": "Progress (%)",
        "specialRequests.drawer.fields.gastoTerceros": "Third-party expenses",
        "specialRequests.drawer.fields.serviceFee": "Service fee",
        "specialRequests.drawer.fields.deadlineNone": "No deadline",
        "specialRequests.drawer.fiscal.title": "Fiscal details",
        "specialRequests.drawer.fiscal.gastoTerceros": "Third-party expenses",
        "specialRequests.drawer.fiscal.serviceFee": "Service fee",
        "specialRequests.drawer.fiscal.subtotal": "Subtotal",
        "specialRequests.drawer.fiscal.iva": "VAT (16%)",
        "specialRequests.drawer.fiscal.total": "Total",
        "specialRequests.drawer.attachments.title": "Attachments",
        "specialRequests.drawer.attachments.empty": "No attachments",
        "specialRequests.drawer.buttons.edit": "Edit",
        "specialRequests.drawer.buttons.save": "Save",
        "specialRequests.drawer.buttons.cancel": "Cancel",
        "specialRequests.drawer.buttons.close": "Close",
        "specialRequests.drawer.actions.whatsapp": "WhatsApp",
        "specialRequests.drawer.actions.cfdi": "CFDI",
        "specialRequests.drawer.actions.print": "Print",
        "specialRequests.drawer.success.saved": "Changes saved",
        "specialRequests.drawer.loadError": "Failed to save changes",
        "specialRequests.drawer.errors.progress_range":
          "Progress must be between 0 and 100",
        "specialRequests.drawer.errors.fiscal_nonnegative":
          "Value cannot be negative",
        "specialRequests.drawer.attachments.add": "Add",
        "specialRequests.drawer.attachments.confirmDelete":
          "Delete? Click to confirm",
        "specialRequests.drawer.attachments.deleteFailed":
          "Failed to delete the attachment",
        "specialRequests.newRequestForm.title": "New special request",
      };
      return keys[key] ?? key;
    },
  }),
}));

jest.mock("@/lib/api/hooks/useSpecialRequests", () => ({
  useSpecialRequests: () => ({
    requests: mockRequests,
    isLoading: false,
    error: null,
    mutate: mockMutate,
  }),
}));

jest.mock("@/lib/api/specialRequests", () => ({
  updateOrderDetails: jest.fn(),
  createSpecialRequest: jest.fn(),
  uploadOrderAttachment: jest.fn(),
  deleteOrderAttachment: jest.fn(),
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { error: jest.fn(), success: jest.fn() },
}));

jest.mock("@dnd-kit/sortable", () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
    isDragging: mockIsDragging,
  }),
}));

jest.mock("@dnd-kit/utilities", () => ({
  CSS: { Transform: { toString: () => undefined } },
}));

const mockMutate = jest.fn().mockResolvedValue(undefined);
const mockUpdate = updateOrderDetails as jest.Mock;

const baseOrder: SpecialOrder = {
  folio: 1001,
  orderId: "uuid-1",
  customerName: "Juan Pérez",
  customerWa: "+52 55 1234 5678",
  status: "pending",
  title: "Colonial House Maqueta",
  description: "Build a scale model.",
  deadline: null,
  attachmentCount: 0,
  attachments: [],
  phase: null,
  progressPct: null,
  gastoTerceros: 1200,
  serviceFee: 450,
};

let mockRequests: SpecialOrder[] = [baseOrder];
let mockIsDragging = false;

// Probe component: simulates a board card opening the drawer through context.
function OpenProbe({ orderId }: { orderId: string }) {
  const { openView } = useRequestDrawer();
  return <button onClick={() => openView(orderId)}>open-probe</button>;
}

function CreateProbe() {
  const { openCreate } = useRequestDrawer();
  return <button onClick={() => openCreate()}>create-probe</button>;
}

function CardProbe() {
  return <RequestCard order={mockRequests[0]} />;
}

function renderDrawer(probe: React.ReactNode = <OpenProbe orderId="uuid-1" />) {
  return render(
    <RequestDrawerProvider>
      {probe}
      <RequestDrawer lng="en" />
    </RequestDrawerProvider>,
  );
}

function openDrawer() {
  renderDrawer();
  fireEvent.click(screen.getByText("open-probe"));
  return screen.getByTestId("request-drawer");
}

describe("RequestDrawer", () => {
  beforeEach(() => {
    mockRequests = [baseOrder];
    mockIsDragging = false;
    jest.clearAllMocks();
    mockMutate.mockResolvedValue(undefined);
  });

  it("opens in view mode with the order data and closes on X and Escape.", () => {
    renderDrawer();
    expect(screen.queryByTestId("request-drawer")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("open-probe"));
    const drawer = screen.getByTestId("request-drawer");
    expect(within(drawer).getByText("Juan Pérez")).toBeInTheDocument();
    expect(within(drawer).getByText("+52 55 1234 5678")).toBeInTheDocument();
    expect(within(drawer).getByText("Pending")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("drawer-close"));
    expect(screen.queryByTestId("request-drawer")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("open-probe"));
    expect(screen.getByTestId("request-drawer")).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByTestId("request-drawer")).not.toBeInTheDocument();
  });

  it("derives fiscal totals at render: IVA on service fee only.", () => {
    const drawer = openDrawer();
    // 1200 + 450 + 16% of 450 (72) = 1722
    expect(within(drawer).getByTestId("fiscal-iva").textContent).toMatch(/72/);
    expect(within(drawer).getByTestId("fiscal-total").textContent).toMatch(
      /1,?\s?722/,
    );
  });

  it("shows the attachments empty state plus the 2b upload control.", () => {
    const drawer = openDrawer();
    expect(within(drawer).getByTestId("attachments-empty")).toHaveTextContent(
      "No attachments",
    );
    expect(
      within(drawer).queryByTestId("attachments-grid"),
    ).not.toBeInTheDocument();
    // Slice 2b: the grid is interactive — an add control is present.
    expect(within(drawer).getByTestId("attachments-add")).toBeInTheDocument();
  });

  it("renders the create form when opened via openCreate.", () => {
    renderDrawer(<CreateProbe />);
    fireEvent.click(screen.getByText("create-probe"));
    const drawer = screen.getByTestId("request-drawer");
    expect(within(drawer).getByText("New special request")).toBeInTheDocument();
    expect(screen.getByTestId("create-form")).toBeInTheDocument();
    // No order data in create mode
    expect(screen.queryByTestId("fiscal-card")).not.toBeInTheDocument();
  });

  it("closes create mode on X and Escape.", () => {
    renderDrawer(<CreateProbe />);
    fireEvent.click(screen.getByText("create-probe"));
    expect(screen.getByTestId("request-drawer")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("drawer-close"));
    expect(screen.queryByTestId("request-drawer")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("create-probe"));
    expect(screen.getByTestId("request-drawer")).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByTestId("request-drawer")).not.toBeInTheDocument();
  });

  it("rejects progress_pct 101 in edit mode and never calls the API.", async () => {
    const drawer = openDrawer();
    fireEvent.click(within(drawer).getByTestId("drawer-edit"));

    const progressInput = screen.getByLabelText("Progress (%)");
    fireEvent.change(progressInput, { target: { value: "101" } });
    fireEvent.click(screen.getByTestId("drawer-save"));

    await waitFor(() => {
      expect(
        screen.getByText("Progress must be between 0 and 100"),
      ).toBeInTheDocument();
    });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("accepts progress_pct 0 and 100 and saves through the API with board revalidation.", async () => {
    mockUpdate.mockResolvedValue({ id: "uuid-1", total_amount: 1722 });
    const drawer = openDrawer();
    fireEvent.click(within(drawer).getByTestId("drawer-edit"));

    const progressInput = screen.getByLabelText("Progress (%)");
    fireEvent.change(progressInput, { target: { value: "100" } });
    fireEvent.click(screen.getByTestId("drawer-save"));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(
        "uuid-1",
        expect.objectContaining({ progress_pct: 100 }),
      );
    });
    expect(toast.success).toHaveBeenCalledWith("Changes saved");
    expect(mockMutate).toHaveBeenCalled();

    // Boundary 0 also persists. Re-entering edit mode REMOUNTS the form with
    // fresh defaults, so the input must be re-queried (no stale node).
    fireEvent.click(within(drawer).getByTestId("drawer-edit"));
    fireEvent.change(screen.getByLabelText("Progress (%)"), {
      target: { value: "0" },
    });
    fireEvent.click(screen.getByTestId("drawer-save"));
    await waitFor(() => {
      expect(mockUpdate).toHaveBeenLastCalledWith(
        "uuid-1",
        expect.objectContaining({ progress_pct: 0 }),
      );
    });
  });

  it("rejects negative fiscal values in edit mode.", async () => {
    const drawer = openDrawer();
    fireEvent.click(within(drawer).getByTestId("drawer-edit"));

    fireEvent.change(screen.getByLabelText("Third-party expenses"), {
      target: { value: "-5" },
    });
    fireEvent.click(screen.getByTestId("drawer-save"));

    await waitFor(() => {
      expect(screen.getByText("Value cannot be negative")).toBeInTheDocument();
    });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rolls back prior values and shows an error toast when the PATCH fails.", async () => {
    mockUpdate.mockRejectedValueOnce(new Error("network"));
    const drawer = openDrawer();
    fireEvent.click(within(drawer).getByTestId("drawer-edit"));

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Changed title" },
    });
    fireEvent.click(screen.getByTestId("drawer-save"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to save changes");
    });
    expect((screen.getByLabelText("Title") as HTMLInputElement).value).toBe(
      "Colonial House Maqueta",
    );
  });

  it("opens from a card click and never from a drag (isDragging guard).", () => {
    // Click on a non-dragging card opens the drawer.
    mockIsDragging = false;
    const first = renderDrawer(<CardProbe />);
    fireEvent.click(screen.getByTestId("request-card-uuid-1"));
    expect(screen.getByTestId("request-drawer")).toBeInTheDocument();
    first.unmount();

    // A fresh render where the card is captured by a drag (isDragging=true)
    // never opens the drawer.
    mockIsDragging = true;
    renderDrawer(<CardProbe />);
    fireEvent.click(screen.getByTestId("request-card-uuid-1"));
    expect(screen.queryByTestId("request-drawer")).not.toBeInTheDocument();
  });
});
