import { Product } from '@/components/inventory/ProductTable';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Artisan Talavera Notebook',
    sku: 'TEX-NB-001',
    description: 'Handcrafted cotton binding',
    stockLevel: 42,
    buyPrice: 12.50,
    salePrice: 24.00,
    image: '/images/notebook.png',
  },
  {
    id: '2',
    name: 'Ceramic Series: Ocean Blue',
    sku: 'TEX-PEN-42',
    description: 'Refillable ink converter',
    stockLevel: 5,
    buyPrice: 45.00,
    salePrice: 89.99,
    image: '/images/pen.png',
  },
  {
    id: '3',
    name: 'Rose Copper Clips (Box/50)',
    sku: 'TEX-ACC-108',
    description: 'Plated surgical steel',
    stockLevel: 0,
    buyPrice: 4.10,
    salePrice: 12.00,
    image: '/images/clips.png',
  },
  {
    id: '4',
    name: 'Cempasúchil Washi Tape',
    sku: 'TEX-TPE-221',
    description: 'Set of 5 roles, floral pattern',
    stockLevel: 112,
    buyPrice: 8.00,
    salePrice: 18.50,
    image: '/images/tape.png',
  },
];

export const MOCK_CATEGORIES = [
  'Notebooks',
  'Fine Pens',
  'Desk Organizers',
  'Adhesives',
  'Out of Stock',
  'New Season'
];
