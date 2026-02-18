import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Products from '../Products';

const mockProduct = {
  _id: '1',
  ProductName: 'Laptop',
  ProductPrice: 999,
  ProductBarcode: 111111111111,
};

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
});

test('renders product list from mocked fetch', async () => {
  fetch.mockResolvedValueOnce({
    status: 201,
    json: async () => [mockProduct],
  });

  render(
    <MemoryRouter>
      <Products />
    </MemoryRouter>
  );

  await waitFor(() => {
    expect(screen.getByText('Laptop')).toBeInTheDocument();
  });
  expect(screen.getByText('999')).toBeInTheDocument();
});

test('renders "Add New Product" button', async () => {
  fetch.mockResolvedValueOnce({
    status: 201,
    json: async () => [],
  });

  render(
    <MemoryRouter>
      <Products />
    </MemoryRouter>
  );

  expect(screen.getByText('+ Add New Product')).toBeInTheDocument();
});

test('handles delete button click', async () => {
  fetch
    .mockResolvedValueOnce({ status: 201, json: async () => [mockProduct] })
    .mockResolvedValueOnce({ status: 201, json: async () => ({ message: 'Deleted' }) })
    .mockResolvedValueOnce({ status: 201, json: async () => [] });

  render(
    <MemoryRouter>
      <Products />
    </MemoryRouter>
  );

  await waitFor(() => {
    expect(screen.getByText('Laptop')).toBeInTheDocument();
  });

  fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

  await waitFor(() => {
    expect(fetch).toHaveBeenCalledWith('/api/deleteproduct/1', { method: 'DELETE' });
  });
});

test('handles fetch error gracefully', async () => {
  fetch.mockRejectedValueOnce(new Error('Network error'));

  render(
    <MemoryRouter>
      <Products />
    </MemoryRouter>
  );

  await waitFor(() => {
    expect(screen.queryByText('Laptop')).not.toBeInTheDocument();
  });
});
