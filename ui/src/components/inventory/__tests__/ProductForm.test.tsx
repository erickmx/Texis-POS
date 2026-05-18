import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProductForm } from '../ProductForm';
import { InventoryModalProvider } from '../../providers/InventoryModalProvider';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) => {
      const translations: Record<string, string> = {
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
        'inventory.modal.pricing_stock': 'Pricing & Stock',
        'inventory.modal.profit_margin': 'Estimated Profit Margin',
        'inventory.modal.profit_margin_na': 'N/A',
        'inventory.modal.profit_margin_value': '{{percent}}% (${{amount}} per unit)',
        'inventory.modal.per_unit': 'per unit',
        'inventory.modal.save': 'Save Product',
        'inventory.modal.cancel': 'Cancel',
        'inventory.categories.notebooks': 'Notebooks',
        'inventory.categories.fine_pens': 'Fine Pens',
        'inventory.categories.desk_organizers': 'Desk Organizers',
        'inventory.categories.adhesives': 'Adhesives',
      };
      let text = translations[key] || key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          text = text.replace(`{{${k}}}`, v);
        });
      }
      return text;
    },
  }),
}));

const mockSubmit = jest.fn().mockResolvedValue(undefined);
const mockCancel = jest.fn();

const renderForm = (props?: { mode?: 'create' | 'edit'; initialData?: any }) => {
  return render(
    <InventoryModalProvider>
      <ProductForm
        mode={props?.mode || 'create'}
        initialData={props?.initialData || null}
        onSubmit={mockSubmit}
        onCancel={mockCancel}
        lng="en"
      />
    </InventoryModalProvider>
  );
};

describe('ProductForm', () => {
  beforeEach(() => {
    mockSubmit.mockClear();
    mockCancel.mockClear();
  });

  it('should render all form fields in create mode.', () => {
    renderForm();
    expect(screen.getByLabelText('Product Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Category')).toBeInTheDocument();
    expect(screen.getByLabelText('SAT Fiscal Code')).toBeInTheDocument();
    expect(screen.getByLabelText('Buy Price')).toBeInTheDocument();
    expect(screen.getByLabelText('Sale Price')).toBeInTheDocument();
    expect(screen.getByLabelText('Initial Stock')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Product Image' })).toBeInTheDocument();
  });

  it('should pre-fill fields in edit mode.', () => {
    renderForm({
      mode: 'edit',
      initialData: {
        name: 'Existing Product',
        description: 'Existing description',
        category: 'fine_pens',
        satCode: '12345678',
        buyPrice: 50,
        salePrice: 75,
        stockLevel: 10,
        image: null,
      },
    });
    expect(screen.getByLabelText('Product Name')).toHaveValue('Existing Product');
    expect(screen.getByLabelText('SAT Fiscal Code')).toHaveValue('12345678');
  });

  it('should show N/A for profit margin when buy price is zero.', () => {
    renderForm();
    fireEvent.change(screen.getByLabelText('Buy Price'), { target: { value: '0' } });
    fireEvent.change(screen.getByLabelText('Sale Price'), { target: { value: '50' } });
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('should calculate profit margin correctly.', () => {
    renderForm();
    fireEvent.change(screen.getByLabelText('Buy Price'), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText('Sale Price'), { target: { value: '75' } });
    expect(screen.getByText('50.0%')).toBeInTheDocument();
    expect(screen.getByText(/25\.00/)).toBeInTheDocument();
  });

  it('should call onSubmit with valid data.', async () => {
    renderForm();
    fireEvent.change(screen.getByLabelText('Product Name'), { target: { value: 'New Product' } });
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'notebooks' } });
    fireEvent.change(screen.getByLabelText('Buy Price'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Sale Price'), { target: { value: '20' } });
    fireEvent.change(screen.getByLabelText('Initial Stock'), { target: { value: '5' } });

    fireEvent.click(screen.getByRole('button', { name: 'Save Product' }));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalled();
    });

    const submittedData = mockSubmit.mock.calls[0][0];
    expect(submittedData.name).toBe('New Product');
    expect(submittedData.category).toBe('notebooks');
    expect(submittedData.buyPrice).toBe(10);
    expect(submittedData.salePrice).toBe(20);
    expect(submittedData.stock).toBe(5);
  });

  it('should show validation error for short SAT code.', async () => {
    renderForm();
    fireEvent.change(screen.getByLabelText('SAT Fiscal Code'), { target: { value: '123' } });
    fireEvent.blur(screen.getByLabelText('SAT Fiscal Code'));

    await waitFor(() => {
      expect(screen.getByText('inventory.modal.errors.sat_code_invalid')).toBeInTheDocument();
    });
  });

  it('should call onCancel when cancel button is clicked.', () => {
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(mockCancel).toHaveBeenCalled();
  });
});
