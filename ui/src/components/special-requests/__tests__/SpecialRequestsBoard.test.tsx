import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  SpecialRequestsBoard,
  createDragEndHandler,
} from "../SpecialRequestsBoard";
import { SpecialOrder } from "@/lib/api/types";
import { updateOrderStatus } from "@/lib/api/specialRequests";
import toast from "react-hot-toast";

// Mock i18n
jest.mock("@/i18n/client", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const keys: Record<string, string> = {
        "sidebar.warehouse": "MAIN WAREHOUSE",
        "specialRequests.title": "Special Requests",
        "specialRequests.newRequest": "New Request",
        "specialRequests.columns.pending": "Pending",
        "specialRequests.columns.in_progress": "In Progress",
        "specialRequests.columns.done": "Done",
        "specialRequests.empty.column": "No orders",
        "specialRequests.empty.board": "No special requests",
        "specialRequests.error.moveFailed": "Failed to move",
      };
      return keys[key] ?? key;
    },
  }),
}));

// Mock SWR hook
const mockMutate = jest.fn();
jest.mock("@/lib/api/hooks/useSpecialRequests", () => ({
  useSpecialRequests: () => ({
    requests: mockRequests,
    isLoading: mockIsLoading,
    error: null,
    mutate: mockMutate,
  }),
}));

// Mock API
jest.mock("@/lib/api/specialRequests", () => ({
  updateOrderStatus: jest
    .fn()
    .mockResolvedValue({ id: "uuid-1", status: "in_progress" }),
}));

// Mock dnd-kit
jest.mock("@dnd-kit/core", () => {
  return {
    DndContext: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
    DragOverlay: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
    PointerSensor: class {},
    KeyboardSensor: class {},
    useSensor: () => ({}),
    useSensors: (...args: unknown[]) => args,
    useDroppable: () => ({ setNodeRef: jest.fn(), isOver: false }),
  };
});

jest.mock("@dnd-kit/sortable", () => ({
  sortableKeyboardCoordinates: () => ({}),
  SortableContext: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  verticalListSortingStrategy: {},
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

jest.mock("@dnd-kit/utilities", () => ({
  CSS: { Transform: { toString: () => undefined } },
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { error: jest.fn() },
}));

// RequestDrawer passthrough: the board renders RequestCard, which consumes
// the drawer context; these tests are board-scoped and mock it out.
const mockOpenCreate = jest.fn();
jest.mock("@/components/providers/RequestDrawerProvider", () => ({
  RequestDrawerProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useRequestDrawer: () => ({
    isOpen: false,
    orderId: null,
    mode: "view",
    openView: jest.fn(),
    openCreate: mockOpenCreate,
    close: jest.fn(),
    setMode: jest.fn(),
  }),
}));

let mockRequests: SpecialOrder[] = [];
let mockIsLoading = false;

describe("SpecialRequestsBoard", () => {
  beforeEach(() => {
    mockRequests = [];
    mockIsLoading = false;
    jest.clearAllMocks();
  });

  it("should render the board title.", () => {
    render(<SpecialRequestsBoard lng="en" />);
    expect(
      screen.getByRole("heading", { name: "Special Requests" }),
    ).toBeInTheDocument();
  });

  it("should render all three columns.", () => {
    mockRequests = [
      {
        folio: 1,
        orderId: "x",
        customerName: "X",
        status: "pending",
        title: "T",
        description: "",
        deadline: null,
        attachmentCount: 0,
        phase: null,
        progressPct: null,
        gastoTerceros: 0,
        serviceFee: 0,
        attachments: [],
        customerWa: "",
      },
    ];
    render(<SpecialRequestsBoard lng="en" />);
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
  });

  it("should enable the New Request button and open create mode.", () => {
    render(<SpecialRequestsBoard lng="en" />);
    const btn = screen.getByTestId("new-request-button");
    expect(btn).not.toBeDisabled();
    fireEvent.click(btn);
    expect(mockOpenCreate).toHaveBeenCalled();
  });

  it("should render orders grouped by status.", () => {
    mockRequests = [
      {
        folio: 100,
        orderId: "a",
        customerName: "A",
        status: "pending",
        title: "Pending Order",
        description: "",
        deadline: null,
        attachmentCount: 0,
        phase: null,
        progressPct: null,
        gastoTerceros: 0,
        serviceFee: 0,
        attachments: [],
        customerWa: "",
      },
      {
        folio: 200,
        orderId: "b",
        customerName: "B",
        status: "in_progress",
        title: "Active Order",
        description: "",
        deadline: null,
        attachmentCount: 0,
        phase: "Build",
        progressPct: 50,
        gastoTerceros: 0,
        serviceFee: 0,
        attachments: [],
        customerWa: "",
      },
    ];
    render(<SpecialRequestsBoard lng="en" />);
    expect(screen.getByText("Pending Order")).toBeInTheDocument();
    expect(screen.getByText("Active Order")).toBeInTheDocument();
  });

  it("should render empty state in columns with no orders.", () => {
    mockRequests = [
      {
        folio: 1,
        orderId: "x",
        customerName: "X",
        status: "pending",
        title: "T",
        description: "",
        deadline: null,
        attachmentCount: 0,
        phase: null,
        progressPct: null,
        gastoTerceros: 0,
        serviceFee: 0,
        attachments: [],
        customerWa: "",
      },
    ];
    render(<SpecialRequestsBoard lng="en" />);
    const emptyStates = screen.getAllByText("No orders");
    expect(emptyStates.length).toBe(2); // in_progress and done columns are empty
  });

  it("should render board-level empty state when not loading and zero requests.", () => {
    mockRequests = [];
    mockIsLoading = false;
    render(<SpecialRequestsBoard lng="en" />);
    expect(screen.getByTestId("board-empty")).toBeInTheDocument();
    expect(screen.getByText("No special requests")).toBeInTheDocument();
  });
});

describe("createDragEndHandler", () => {
  const baseOrder: SpecialOrder = {
    folio: 100,
    orderId: "order-1",
    customerName: "Test",
    status: "pending",
    title: "Test Order",
    description: "",
    deadline: null,
    attachmentCount: 0,
    phase: null,
    progressPct: null,
    gastoTerceros: 0,
    serviceFee: 0,
    attachments: [],
    customerWa: "",
  };

  it("should call updateOrderStatus with dragged order id and target column status.", async () => {
    const mockMutate = jest.fn().mockResolvedValue(undefined);
    const mockT = (key: string) => key;
    const handler = createDragEndHandler({
      requests: [baseOrder],
      mutate: mockMutate,
      t: mockT,
      onClearActive: jest.fn(),
    });

    await handler({
      active: { id: "order-1" },
      over: { id: "in_progress" },
    } as never);

    expect(mockMutate).toHaveBeenCalledTimes(1);
    const [mutateFn, opts] = mockMutate.mock.calls[0];
    expect(typeof mutateFn).toBe("function");
    expect(opts).toMatchObject({ rollbackOnError: true, revalidate: true });
    await mutateFn();
    expect(updateOrderStatus).toHaveBeenCalledWith("order-1", "in_progress");
  });

  it("should call toast.error with moveFailed message when PATCH rejects.", async () => {
    const mockMutate = jest.fn().mockRejectedValue(new Error("network error"));
    const mockT = (key: string) => {
      if (key === "specialRequests.error.moveFailed")
        return "Failed to move the order";
      return key;
    };
    const handler = createDragEndHandler({
      requests: [baseOrder],
      mutate: mockMutate,
      t: mockT,
      onClearActive: jest.fn(),
    });

    await handler({
      active: { id: "order-1" },
      over: { id: "in_progress" },
    } as never);

    expect(toast.error).toHaveBeenCalledWith("Failed to move the order");
  });
});
