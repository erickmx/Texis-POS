import { render, screen } from '@testing-library/react';
import { Button } from '../Button';

describe('Button Component', () => {
  it('should render children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('should apply the primary gradient class by default', () => {
    render(<Button variant="primary">Primary Button</Button>);
    const button = screen.getByRole('button');
    // Using semantic outcome/attribute check where possible, but checking for our custom class
    expect(button).toHaveClass('bg-talavera');
  });

  it('should apply the xl roundedness class', () => {
    render(<Button>Rounded Button</Button>);
    expect(screen.getByRole('button')).toHaveClass('rounded-xl');
  });

  it('should apply secondary container class for secondary variant', () => {
    render(<Button variant="secondary">Secondary Button</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-secondary-container');
  });

  it('should apply ghost classes for ghost variant', () => {
    render(<Button variant="ghost">Ghost Button</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-transparent');
    expect(screen.getByRole('button')).toHaveClass('border-outline-variant');
  });

  it('should be disabled', () => {
    render(<Button disabled>Disabled Button</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
