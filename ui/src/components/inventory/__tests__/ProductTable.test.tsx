import { render, screen } from '@testing-library/react';
import { ProductTable } from '../ProductTable';
import { InventoryModalProvider } from '../../providers/InventoryModalProvider';
import { Product } from '@/lib/api/types';

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Artisan Talavera Notebook',
    sku: 'TEX-NB-001',
    description: 'Handcrafted cotton binding',
    stockLevel: 42,
    buyPrice: 12.50,
    salePrice: 24.00,
    image: '/notebook.png',
    categories: [],
    satCode: '12345678',
    isDeleted: false,
    createdAt: '2024-01-01T00:00:00Z',
  },
];

jest.mock('@/i18n/client', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'inventory.table.product': 'Producto',
        'inventory.table.sku': 'SKU',
        'inventory.table.in_stock': 'EN STOCK',
        'inventory.table.units': 'Unidades',
        'inventory.table.stock_level': 'Stock',
        'inventory.table.buy_price': 'Buy',
        'inventory.table.sale_price': 'Sale',
        'inventory.table.actions': 'Actions',
        'inventory.table.out_of_stock': 'OUT',
        'inventory.table.low_stock': 'LOW',
        'inventory.table.showing': 'Showing',
      };
      return translations[key] || key;
    },
  }),
}));

describe('ProductTable Component', () => {
  it('should render product name and translated labels', () => {
    render(
      <InventoryModalProvider>
        <ProductTable products={mockProducts} lng="es" />
      </InventoryModalProvider>
    );

    expect(screen.getByText('Artisan Talavera Notebook')).toBeInTheDocument();
    expect(screen.getByText('EN STOCK')).toBeInTheDocument();
    expect(screen.getByText(/42/)).toBeInTheDocument();
    expect(screen.getByText(/Unidades/)).toBeInTheDocument();
  });
});
