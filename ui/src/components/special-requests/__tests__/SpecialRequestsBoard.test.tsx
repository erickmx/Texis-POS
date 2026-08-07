import React from 'react';
import { render, screen } from '@testing-library/react';
import { SpecialRequestsBoard } from '../SpecialRequestsBoard';
import { SpecialOrder } from '@/lib/api/types';

// Mock i18n
jest.mock('@/i18n/client', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const keys: Record<string, string> = {
        'sidebar.warehouse': 'MAIN WAREHOUSE',
        'specialRequests.title': 'Special Requests',
        'specialRequests.newRequest': 'New Request',
        'specialRequests.columns.pending': 'Pending',
        'specialRequests.columns.in_progress': 'In Progress',
        'specialRequests.columns.done': 'Done',
        'specialRequests.empty.column': 'No orders',
        'specialRequests.error.moveFailed': 'Failed to move',
      };
      return keys[key] ?? key;
    },
  }),
}));

// Mock SWR hook
const mockMutate = jest.fn();
jest.mock('@/lib/api/hooks/useSpecialRequests', () => ({
  useSpecialRequests: () => ({
    requests: mockRequests,
    isLoading: mockIsLoading,
    error: null,
    mutate: mockMutate,
  }),
}));

// Mock API
jest.mock('@/lib/api/specialRequests', () => ({
  updateOrderStatus: jest.fn().mockResolvedValue({ id: 'uuid-1', status: 'in_progress' }),
}));

// Mock dnd-kit
jest.mock('@dnd-kit/core', () => {
  return {
    DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    DragOverlay: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    PointerSensor: class {},
    KeyboardSensor: class {},
    useSensor: () => ({}),
    useSensors: (...args: unknown[]) => args,
    useDroppable: () => ({ setNodeRef: jest.fn(), isOver: false }),
  };
});

jest.mock('@dnd-kit/sortable', () => ({
  sortableKeyboardCoordinates: () => ({}),
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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

jest.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => undefined } },
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { error: jest.fn() },
}));

let mockRequests: SpecialOrder[] = [];
let mockIsLoading = false;

describe('SpecialRequestsBoard', () => {
  beforeEach(() => {
    mockRequests = [];
    mockIsLoading = false;
    jest.clearAllMocks();
  });

  it('should render the board title.', () => {
    render(<SpecialRequestsBoard lng="en" />);
    expect(screen.getByRole('heading', { name: 'Special Requests' })).toBeInTheDocument();
  });

  it('should render all three columns.', () => {
    render(<SpecialRequestsBoard lng="en" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('should render the inert New Request button.', () => {
    render(<SpecialRequestsBoard lng="en" />);
    const btn = screen.getByText('New Request');
    expect(btn).toBeInTheDocument();
    expect(btn.closest('button')).toBeDisabled();
  });

  it('should render orders grouped by status.', () => {
    mockRequests = [
      {
        folio: 100, orderId: 'a', customerName: 'A', status: 'pending',
        title: 'Pending Order', description: '', deadline: null,
        attachmentCount: 0, phase: null, progressPct: null,
      },
      {
        folio: 200, orderId: 'b', customerName: 'B', status: 'in_progress',
        title: 'Active Order', description: '', deadline: null,
        attachmentCount: 0, phase: 'Build', progressPct: 50,
      },
    ];
    render(<SpecialRequestsBoard lng="en" />);
    expect(screen.getByText('Pending Order')).toBeInTheDocument();
    expect(screen.getByText('Active Order')).toBeInTheDocument();
  });

  it('should render empty state in columns with no orders.', () => {
    render(<SpecialRequestsBoard lng="en" />);
    const emptyStates = screen.getAllByText('No orders');
    expect(emptyStates.length).toBe(3);
  });
});
