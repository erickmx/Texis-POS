import React from "react";
import { render, screen } from "@testing-library/react";
import { BoardColumn } from "../BoardColumn";
import { SpecialOrder } from "@/lib/api/types";

// Mock dnd-kit
jest.mock("@dnd-kit/core", () => ({
  useDroppable: () => ({ setNodeRef: jest.fn(), isOver: false }),
}));

jest.mock("@dnd-kit/sortable", () => ({
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

// The card consumes the drawer context to open the drawer on click.
jest.mock("@/components/providers/RequestDrawerProvider", () => ({
  RequestDrawerProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useRequestDrawer: () => ({
    isOpen: false,
    orderId: null,
    mode: "view",
    openView: jest.fn(),
    close: jest.fn(),
    setMode: jest.fn(),
  }),
}));

const pendingOrder: SpecialOrder = {
  folio: 100,
  orderId: "uuid-1",
  customerName: "Test",
  customerWa: "",
  status: "pending",
  title: "Test Order",
  description: "Test description",
  deadline: null,
  attachmentCount: 0,
  attachments: [],
  phase: null,
  progressPct: null,
  gastoTerceros: 0,
  serviceFee: 0,
};

describe("BoardColumn", () => {
  it("should render column header with label and count.", () => {
    render(
      <BoardColumn
        status="pending"
        label="Pending"
        orders={[pendingOrder]}
        isLoading={false}
        emptyLabel="No orders"
      />,
    );
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("should render orders in the column.", () => {
    render(
      <BoardColumn
        status="pending"
        label="Pending"
        orders={[pendingOrder]}
        isLoading={false}
        emptyLabel="No orders"
      />,
    );
    expect(screen.getByText("#100")).toBeInTheDocument();
    expect(screen.getByText("Test Order")).toBeInTheDocument();
  });

  it("should render empty state when no orders.", () => {
    render(
      <BoardColumn
        status="pending"
        label="Pending"
        orders={[]}
        isLoading={false}
        emptyLabel="No orders"
      />,
    );
    expect(screen.getByText("No orders")).toBeInTheDocument();
  });

  it("should render skeleton cards when loading.", () => {
    const { container } = render(
      <BoardColumn
        status="pending"
        label="Pending"
        orders={[]}
        isLoading={true}
        emptyLabel="No orders"
      />,
    );
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThanOrEqual(2);
  });
});
