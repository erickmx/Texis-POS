import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ProductModal } from '../ProductModal';
import { useInventoryModal } from '../../providers/InventoryModalProvider';

// Mock the provider
jest.mock('../../providers/InventoryModalProvider', () => ({
  useInventoryModal: jest.fn(),
}));

// Mock i18n client
jest.mock('@/i18n/client', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) => {
      const translations: Record<string, string> = {
        'inventory.modal.create_title': 'New Product',
        'inventory.modal.edit_title': 'Edit Product',
        'inventory.modal.success_create': 'Product created successfully',
        'inventory.modal.success_edit': 'Product updated successfully',
        'inventory.modal.error_generic': 'Something went wrong.',
        'inventory.modal.name': 'Product Name',
        'inventory.modal.name_placeholder': 'Enter product name',
        'inventory.modal.description': 'Description',
        'inventory.modal.description_placeholder': 'Enter product description',
        'inventory.modal.category': 'Category',
        'inventory.modal.category_placeholder': 'Select a category',
        'inventory.modal.sat_code': 'SAT Fiscal Code',
        'inventory.modal.sat_code_placeholder': '8-digit numeric code',
        'inventory.modal.buy_price': 'Buy Price',
        'inventory.modal.sale_price': 'Sale Price',
        'inventory.modal.stock': 'Initial Stock',
        'inventory.modal.image': 'Product Image',
        'inventory.modal.image_drop': 'Drag and drop an image here',
        'inventory.modal.image_types': 'JPEG, PNG, WebP up to 5MB',
        'inventory.modal.save': 'Save Product',
        'inventory.modal.cancel': 'Cancel',
        'inventory.modal.profit_margin': 'Estimated Profit Margin',
        'inventory.modal.profit_margin_value': '{{percent}}% ({{amount}} per unit)',
        'inventory.modal.errors.name_required': 'Name is required',
        'inventory.modal.errors.category_required': 'Category is required',
        'inventory.modal.errors.buy_price_positive': 'Buy price must be positive',
        'inventory.modal.errors.sale_price_positive': 'Sale price must be positive',
        'inventory.modal.errors.stock_nonnegative': 'Stock must be non-negative',
      };
      if (params) {
        let result = translations[key] || key;
        Object.entries(params).forEach(([k, v]) => {
          result = result.replace(`{{${k}}}`, v);
        });
        return result;
      }
      return translations[key] || key;
    },
    i18n: { resolvedLanguage: 'en' },
  }),
}));

// Mock toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

describe('ProductModal', () => {
  const mockClose = jest.fn();
  const defaultContext = {
    isOpen: true,
    mode: 'create' as const,
    product: undefined,
    openCreate: jest.fn(),
    openEdit: jest.fn(),
    close: mockClose,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useInventoryModal as jest.Mock).mockReturnValue(defaultContext);
  });

  it('should render modal with create title when mode is create.', () => {
    render(<ProductModal lng="en" />);
    expect(screen.getByText('New Product')).toBeInTheDocument();
  });

  it('should render modal with edit title when mode is edit.', () => {
    (useInventoryModal as jest.Mock).mockReturnValue({
      ...defaultContext,
      mode: 'edit',
      product: {
        name: 'Test Product',
        description: 'Test description',
        category: 'notebooks' as const,
        buyPrice: 10,
        salePrice: 20,
        stockLevel: 5,
      },
    });
    render(<ProductModal lng="en" />);
    expect(screen.getByText('Edit Product')).toBeInTheDocument();
  });

  it('should not render modal when isOpen is false.', () => {
    (useInventoryModal as jest.Mock).mockReturnValue({
      ...defaultContext,
      isOpen: false,
    });
    render(<ProductModal lng="en" />);
    expect(screen.queryByText('New Product')).not.toBeInTheDocument();
  });

  it('should call close when cancel button is clicked.', () => {
    render(<ProductModal lng="en" />);
    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);
    expect(mockClose).toHaveBeenCalled();
  });
});
