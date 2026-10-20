import React from "react";
import { render, screen } from "@testing-library/react";
import { RequestCard } from "../RequestCard";
import { SpecialOrder } from "@/lib/api/types";

// Mock dnd-kit sortable
jest.mock("@dnd-kit/sortable", () => ({
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

const baseOrder: SpecialOrder = {
  folio: 1001,
  orderId: "uuid-1",
  customerName: "Juan Pérez",
  status: "pending",
  title: "Colonial House Maqueta",
  description:
    "Build a scale model of the colonial house with detailed interior.",
  deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
  attachmentCount: 3,
  attachments: ["a.png", "b.png", "c.png"],
  phase: null,
  progressPct: null,
  gastoTerceros: 1200,
  serviceFee: 450,
  customerWa: "+525551234567",
};

describe("RequestCard", () => {
  it("should render the folio number.", () => {
    render(<RequestCard order={baseOrder} />);
    expect(screen.getByText("#1001")).toBeInTheDocument();
  });

  it("should render the title in bold.", () => {
    render(<RequestCard order={baseOrder} />);
    const title = screen.getByText("Colonial House Maqueta");
    expect(title).toBeInTheDocument();
    expect(title.className).toContain("font-bold");
  });

  it("should render the description with line clamp.", () => {
    render(<RequestCard order={baseOrder} />);
    const desc = screen.getByText(/Build a scale model/);
    expect(desc).toBeInTheDocument();
    expect(desc.className).toContain("line-clamp-2");
  });

  it("should render an urgency chip.", () => {
    render(<RequestCard order={baseOrder} />);
    expect(screen.getByText("Warning")).toBeInTheDocument();
  });

  it("should render attachment chip when count is greater than zero.", () => {
    render(<RequestCard order={baseOrder} />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("should not render attachment chip when count is zero.", () => {
    const order = { ...baseOrder, attachmentCount: 0 };
    render(<RequestCard order={order} />);
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("should render progress bar when status is in_progress.", () => {
    const order: SpecialOrder = {
      ...baseOrder,
      status: "in_progress",
      phase: "Build",
      progressPct: 40,
    };
    render(<RequestCard order={order} />);
    expect(screen.getByText("Build 40%")).toBeInTheDocument();
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
  });

  it("should not render progress bar when status is pending.", () => {
    render(<RequestCard order={baseOrder} />);
    expect(screen.queryByText("ACTIVE")).not.toBeInTheDocument();
  });

  it("should degrade gracefully when phase and progressPct are null.", () => {
    const order: SpecialOrder = {
      ...baseOrder,
      status: "in_progress",
      phase: null,
      progressPct: null,
    };
    render(<RequestCard order={order} />);
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
  });

  it("should render customer name.", () => {
    render(<RequestCard order={baseOrder} />);
    expect(screen.getByText("Juan Pérez")).toBeInTheDocument();
  });
});
