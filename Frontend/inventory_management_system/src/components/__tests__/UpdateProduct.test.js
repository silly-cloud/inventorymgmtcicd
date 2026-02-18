import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import UpdateProduct from '../UpdateProduct';

const mockProduct = {
  _id: 'abc123',
  ProductName: 'Laptop',
  ProductPrice: 999,
  ProductBarcode: 111111111111,
};

beforeEach(() => {
  global.fetch = jest.fn();
  window.alert = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
});

// Render UpdateProduct inside a real route so useParams() returns { id: 'abc123' }
const renderWithRoute = () =>
  render(
    <MemoryRouter initialEntries={['/updateproduct/abc123']}>
      <Routes>
        <Route path="/updateproduct/:id" element={<UpdateProduct />} />
      </Routes>
    </MemoryRouter>
  );

test('fetches and populates existing product data on mount', async () => {
  fetch.mockResolvedValueOnce({
    status: 201,
    json: async () => mockProduct,
  });

  renderWithRoute();

  await waitFor(() => {
    expect(screen.getByDisplayValue('Laptop')).toBeInTheDocument();
  });
});

test('calls fetch PUT /api/updateproduct/abc123 on submit', async () => {
  fetch
    .mockResolvedValueOnce({ status: 201, json: async () => mockProduct })
    .mockResolvedValueOnce({ status: 201, json: async () => ({}) });

  renderWithRoute();

  // Wait for the form to be pre-filled from the initial GET
  await waitFor(() => {
    expect(screen.getByDisplayValue('Laptop')).toBeInTheDocument();
  });

  fireEvent.click(screen.getByRole('button', { name: 'Update' }));

  await waitFor(() => {
    expect(fetch).toHaveBeenCalledWith(
      '/api/updateproduct/abc123',
      expect.objectContaining({
        method: 'PUT',
      })
    );
  });
});
