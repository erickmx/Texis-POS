import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '../page';

// Mock useTranslation for client components
jest.mock('@/i18n/client', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (key === 'auth.login_title') return 'Iniciar Sesión';
      if (key === 'auth.email_label') return 'Usuario o Correo Electrónico';
      if (key === 'auth.password_label') return 'Contraseña';
      if (key === 'auth.submit_button') return 'Ingresar';
      if (key === 'auth.show_password') return 'Mostrar contraseña';
      if (key === 'auth.error_invalid_credentials') return 'Credenciales inválidas';
      if (key === 'auth.validation.email_required') return 'El usuario o correo electrónico es requerido';
      if (key === 'auth.validation.password_required') return 'La contraseña es requerida';
      return key;
    },
  }),
}));

// Mock next/navigation
const mockPush = jest.fn();
const mockRefresh = jest.fn();
const mockSearchParamsGet = jest.fn().mockReturnValue(null);

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  useSearchParams: () => ({
    get: mockSearchParamsGet,
  }),
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  error: jest.fn(),
  success: jest.fn(),
}));

// Mock React.use for React 19 suspense resolution in tests
jest.spyOn(React, 'use').mockImplementation((promise) => {
  return { lng: 'es' };
});

describe('LoginPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const getParams = () => Promise.resolve({ lng: 'es' });

  it('should render the login form elements', async () => {
    render(<LoginPage params={getParams()} />);

    expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument();
    expect(screen.getByLabelText('Usuario o Correo Electrónico')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
    expect(screen.getByLabelText('Mostrar contraseña')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeInTheDocument();
  });

  it('should toggle password visibility when clicking show password checkbox', async () => {
    render(<LoginPage params={getParams()} />);

    const passwordInput = screen.getByLabelText('Contraseña') as HTMLInputElement;
    const checkbox = screen.getByLabelText('Mostrar contraseña');

    expect(passwordInput.type).toBe('password');
    fireEvent.click(checkbox);
    expect(passwordInput.type).toBe('text');
    fireEvent.click(checkbox);
    expect(passwordInput.type).toBe('password');
  });

  it('should show validation errors when fields are empty and form is submitted', async () => {
    render(<LoginPage params={getParams()} />);

    const submitButton = screen.getByRole('button', { name: 'Ingresar' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('El usuario o correo electrónico es requerido')).toBeInTheDocument();
      expect(screen.getByText('La contraseña es requerida')).toBeInTheDocument();
    });
  });
});
