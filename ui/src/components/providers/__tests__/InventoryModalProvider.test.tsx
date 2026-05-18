import { render, screen, fireEvent, renderHook } from '@testing-library/react';
import { useInventoryModal, InventoryModalProvider } from '../InventoryModalProvider';

const TestComponent = () => {
  const { isOpen, mode, product, openCreate, openEdit, close } = useInventoryModal();
  return (
    <div>
      <span data-testid="isOpen">{isOpen ? 'open' : 'closed'}</span>
      <span data-testid="mode">{mode}</span>
      <span data-testid="product">{product ? product.name : 'none'}</span>
      <button onClick={openCreate}>Open Create</button>
      <button onClick={() => openEdit({ name: 'Test Product', category: 'notebooks', buyPrice: 10, salePrice: 20, stockLevel: 5 })}>
        Open Edit
      </button>
      <button onClick={close}>Close</button>
    </div>
  );
};

describe('InventoryModalProvider', () => {
  it('should provide default closed state.', () => {
    render(
      <InventoryModalProvider>
        <TestComponent />
      </InventoryModalProvider>
    );
    expect(screen.getByTestId('isOpen').textContent).toBe('closed');
    expect(screen.getByTestId('mode').textContent).toBe('create');
    expect(screen.getByTestId('product').textContent).toBe('none');
  });

  it('should open in create mode.', () => {
    render(
      <InventoryModalProvider>
        <TestComponent />
      </InventoryModalProvider>
    );
    fireEvent.click(screen.getByText('Open Create'));
    expect(screen.getByTestId('isOpen').textContent).toBe('open');
    expect(screen.getByTestId('mode').textContent).toBe('create');
    expect(screen.getByTestId('product').textContent).toBe('none');
  });

  it('should open in edit mode with product.', () => {
    render(
      <InventoryModalProvider>
        <TestComponent />
      </InventoryModalProvider>
    );
    fireEvent.click(screen.getByText('Open Edit'));
    expect(screen.getByTestId('isOpen').textContent).toBe('open');
    expect(screen.getByTestId('mode').textContent).toBe('edit');
    expect(screen.getByTestId('product').textContent).toBe('Test Product');
  });

  it('should close modal and reset state.', () => {
    render(
      <InventoryModalProvider>
        <TestComponent />
      </InventoryModalProvider>
    );
    fireEvent.click(screen.getByText('Open Edit'));
    expect(screen.getByTestId('isOpen').textContent).toBe('open');
    fireEvent.click(screen.getByText('Close'));
    expect(screen.getByTestId('isOpen').textContent).toBe('closed');
    expect(screen.getByTestId('product').textContent).toBe('none');
  });

  it('should throw when hook is used outside provider.', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      renderHook(() => useInventoryModal());
    }).toThrow('useInventoryModal must be used within an InventoryModalProvider');
    consoleSpy.mockRestore();
  });
});
