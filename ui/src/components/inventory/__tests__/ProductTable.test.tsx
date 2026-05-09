import { render, screen } from '@testing-library/react';
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
  {
    id: '2',
    name: 'Ceramic Series: Ocean Blue',
    sku: 'TEX-PEN-42',
    description: 'Refillable ink converter',
    stockLevel: 5,
    buyPrice: 45.00,
    salePrice: 89.99,
    image: '/pen.png',
  },
];

describe('ProductTable Component', () => {
  it('should render all product rows correctly', () => {
    render(<ProductTable products={mockProducts} />);
    expect(screen.getByText('Artisan Talavera Notebook')).toBeInTheDocument();
    expect(screen.getByText('Ceramic Series: Ocean Blue')).toBeInTheDocument();
  });

  it('should displays the correct SKU', () => {
    render(<ProductTable products={mockProducts} />);
    expect(screen.getByText('TEX-NB-001')).toBeInTheDocument();
    expect(screen.getByText('TEX-PEN-42')).toBeInTheDocument();
  });

  it('should calculate and display stock status badges correctly', () => {
    render(<ProductTable products={mockProducts} />);
    // Artisan Notebook (42 units) -> IN STOCK
    expect(screen.getByText(/IN STOCK/i)).toBeInTheDocument();
    // Ceramic Pen (5 units) -> LOW STOCK
    expect(screen.getByText(/LOW STOCK/i)).toBeInTheDocument();
  });

  it('should format prices correctly', () => {
    render(<ProductTable products={mockProducts} />);
    expect(screen.getByText('$12.50')).toBeInTheDocument();
    expect(screen.getByText('$24.00')).toBeInTheDocument();
    expect(screen.getByText('$89.99')).toBeInTheDocument();
  });

  it('should render action icons for each row', () => {
    const { getAllByRole } = render(<ProductTable products={mockProducts} />);
    // Should have 2 edit buttons (lucide Pencil icon)
    const actionButtons = getAllByRole('button');
    // More buttons might be in pagination, but for rows we expect pencil icons
    expect(actionButtons.length).toBeGreaterThanOrEqual(2);
  });
});
