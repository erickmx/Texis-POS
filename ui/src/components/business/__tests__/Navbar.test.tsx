import { render, screen } from '@testing-library/react';
import { Navbar } from '../Navbar';

describe('Navbar Component', () => {
  it('should render a search input with placeholder', () => {
    render(<Navbar />);
    expect(screen.getByPlaceholderText(/Search inventory, SKUs, or orders/i)).toBeInTheDocument();
  });

  it('should render the "New Product" button', () => {
    render(<Navbar />);
    expect(screen.getByRole('button', { name: /New Product/i })).toBeInTheDocument();
  });

  it('should render utility icons (Bell, Settings)', () => {
    const { container } = render(<Navbar />);
    // Icons are Lucide SVG components
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('should render user profile section', () => {
    render(<Navbar />);
    // Initial profile should have an avatar-like container or image
    expect(screen.getByRole('img', { name: /User Profile/i })).toBeInTheDocument();
  });
});
