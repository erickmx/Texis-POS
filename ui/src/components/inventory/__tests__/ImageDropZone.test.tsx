import { render, screen, fireEvent } from '@testing-library/react';
import { ImageDropZone } from '../../inventory/ImageDropZone';

// Mock URL.createObjectURL for jsdom
global.URL.createObjectURL = jest.fn(() => 'mock-object-url');
global.URL.revokeObjectURL = jest.fn();

// Mock @dnd-kit/core
jest.mock('@dnd-kit/core', () => ({
  useDroppable: () => ({
    setNodeRef: jest.fn(),
    isOver: false,
  }),
  DndContext: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock i18n client
jest.mock('@/i18n/client', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'inventory.modal.errors.image_type': 'Only JPEG, PNG, and WebP images are accepted',
        'inventory.modal.errors.image_size': 'Image must be under 5MB',
        'inventory.modal.image': 'Product Image',
        'inventory.modal.image_drop': 'Drag and drop an image here, or click to select',
        'inventory.modal.image_types': 'JPEG, PNG, WebP up to 5MB',
        'inventory.modal.image_remove': 'Remove image',
        'inventory.modal.image_preview_alt': 'Product preview',
      };
      return translations[key] || key;
    },
    i18n: { resolvedLanguage: 'en' },
  }),
}));

describe('ImageDropZone', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('should render drop zone when no image is selected.', () => {
    render(<ImageDropZone onChange={mockOnChange} lng="en" />);
    expect(screen.getByRole('button', { name: /Product Image/i })).toBeInTheDocument();
    expect(screen.getByText(/Drag and drop an image here/)).toBeInTheDocument();
  });

  it('should call onChange with file when valid image is dropped.', () => {
    render(<ImageDropZone onChange={mockOnChange} lng="en" />);
    const dropZone = screen.getByRole('button', { name: /Product Image/i });

    const file = new File(['dummy'], 'test.png', { type: 'image/png' });
    const dataTransfer = {
      files: [file],
    };

    fireEvent.drop(dropZone, { dataTransfer });
    expect(mockOnChange).toHaveBeenCalledWith(file);
  });

  it('should show error for oversized file.', () => {
    render(<ImageDropZone onChange={mockOnChange} lng="en" />);
    const dropZone = screen.getByRole('button', { name: /Product Image/i });

    const largeContent = new Uint8Array(5 * 1024 * 1024 + 1);
    const file = new File([largeContent], 'large.png', { type: 'image/png' });
    const dataTransfer = { files: [file] };

    fireEvent.drop(dropZone, { dataTransfer });
    expect(screen.getByText('Image must be under 5MB')).toBeInTheDocument();
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('should show error for invalid file type.', () => {
    render(<ImageDropZone onChange={mockOnChange} lng="en" />);
    const dropZone = screen.getByRole('button', { name: /Product Image/i });

    const file = new File(['dummy'], 'test.pdf', { type: 'application/pdf' });
    const dataTransfer = { files: [file] };

    fireEvent.drop(dropZone, { dataTransfer });
    expect(screen.getByText('Only JPEG, PNG, and WebP images are accepted')).toBeInTheDocument();
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('should show preview when a file is provided.', () => {
    const file = new File(['dummy'], 'test.png', { type: 'image/png' });
    render(<ImageDropZone value={file} onChange={mockOnChange} lng="en" />);
    expect(screen.getByAltText('Product preview')).toBeInTheDocument();
  });

  it('should clear file when remove button is clicked.', () => {
    const file = new File(['dummy'], 'test.png', { type: 'image/png' });
    render(<ImageDropZone value={file} onChange={mockOnChange} lng="en" />);
    const removeBtn = screen.getByRole('button', { name: /Remove image/i });
    fireEvent.click(removeBtn);
    expect(mockOnChange).toHaveBeenCalledWith(null);
  });

  it('should trigger file input on click.', () => {
    render(<ImageDropZone onChange={mockOnChange} lng="en" />);
    const dropZone = screen.getByRole('button', { name: /Product Image/i });
    fireEvent.click(dropZone);
    const input = document.querySelector('input[type="file"]');
    expect(input).toBeInTheDocument();
  });

  it('should trigger file input on Enter key.', () => {
    render(<ImageDropZone onChange={mockOnChange} lng="en" />);
    const dropZone = screen.getByRole('button', { name: /Product Image/i });
    fireEvent.keyDown(dropZone, { key: 'Enter' });
    const input = document.querySelector('input[type="file"]');
    expect(input).toBeInTheDocument();
  });
});
