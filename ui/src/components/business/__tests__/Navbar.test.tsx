import { render, screen } from '@testing-library/react';
import { Navbar } from '../Navbar';
import { InventoryModalProvider } from '../../providers/InventoryModalProvider';

// Mock useTranslation for client components
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      if (key === 'navbar.search_placeholder') return 'Buscar inventario...';
      if (key === 'navbar.new_product') return 'Nuevo Producto';
      return key;
    },
  }),
}));

const renderWithProvider = (ui: React.ReactElement) => {
  return render(<InventoryModalProvider>{ui}</InventoryModalProvider>);
};

describe('Navbar Component', () => {
  it('should render a search input with localized placeholder', () => {
    renderWithProvider(<Navbar lng="es" />);
    expect(screen.getByPlaceholderText('Buscar inventario...')).toBeInTheDocument();
  });

  it('should render the localized "New Product" button', () => {
    renderWithProvider(<Navbar lng="es" />);
    expect(screen.getByRole('button', { name: 'Nuevo Producto' })).toBeInTheDocument();
  });

  it('should render utility icons (Bell, Settings)', () => {
    const { container } = renderWithProvider(<Navbar lng="es" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('should render user profile section', () => {
    renderWithProvider(<Navbar lng="es" />);
    expect(screen.getByRole('img', { name: /User Profile/i })).toBeInTheDocument();
  });
});
