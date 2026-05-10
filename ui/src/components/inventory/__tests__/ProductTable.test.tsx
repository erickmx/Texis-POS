import { render, screen, act } from '@testing-library/react';
import { ProductTable } from '../ProductTable';

const mockProducts = [
  {
    id: '1',
    name: 'Artisan Talavera Notebook',
    sku: 'TEX-NB-001',
    description: 'Handcrafted cotton binding',
    stockLevel: 42,
    buyPrice: 12.50,
    salePrice: 24.00,
    image: '/notebook.png',
  },
];

// Mock server side useTranslation
jest.mock('@/i18n/server', () => ({
  useTranslation: () => Promise.resolve({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'inventory.table.product': 'Producto',
        'inventory.table.sku': 'SKU',
        'inventory.table.in_stock': 'EN STOCK',
        'inventory.table.units': 'Unidades',
      };
      return translations[key] || key;
    },
  }),
}));

describe('ProductTable Component', () => {
  it('should render product name and translated labels', async () => {
    // Since it's an async component, we await its render or use findBy
    await act(async () => {
      render(await ProductTable({ products: mockProducts, lng: 'es' }) as any);
    });
    
    expect(screen.getByText('Artisan Talavera Notebook')).toBeInTheDocument();
    expect(screen.getByText('EN STOCK')).toBeInTheDocument();
    expect(screen.getByText(/42/)).toBeInTheDocument();
    expect(screen.getByText(/Unidades/)).toBeInTheDocument();
  });
});
