import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import InsertProduct from '../InsertProduct';

beforeEach(() => {
  global.fetch = jest.fn();
  window.alert = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
});

test('renders all 3 input fields and Insert button', () => {
  render(
    <MemoryRouter>
      <InsertProduct />
    </MemoryRouter>
  );

  // type="text" → role textbox; type="number" → role spinbutton
  expect(screen.getByRole('textbox')).toBeInTheDocument();
  expect(screen.getAllByRole('spinbutton')).toHaveLength(2);
  expect(screen.getByRole('button', { name: 'Insert' })).toBeInTheDocument();
});

test('shows validation error when submitting empty form', () => {
  render(
    <MemoryRouter>
      <InsertProduct />
    </MemoryRouter>
  );

  fireEvent.click(screen.getByRole('button', { name: 'Insert' }));

  expect(
    screen.getByText('*Please fill in all the required fields.')
  ).toBeInTheDocument();
});

test('calls fetch POST /api/insertproduct on submit with correct payload', async () => {
  fetch.mockResolvedValueOnce({ status: 201, json: async () => ({}) });

  render(
    <MemoryRouter>
      <InsertProduct />
    </MemoryRouter>
  );

  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Laptop' } });

  const [priceInput, barcodeInput] = screen.getAllByRole('spinbutton');
  fireEvent.change(priceInput, { target: { value: '999' } });
  fireEvent.change(barcodeInput, { target: { value: '111111111111' } });

  fireEvent.click(screen.getByRole('button', { name: 'Insert' }));

  await waitFor(() => {
    expect(fetch).toHaveBeenCalledWith(
      '/api/insertproduct',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ProductName: 'Laptop',
          ProductPrice: '999',
          ProductBarcode: '111111111111',
        }),
      })
    );
  });
});

test('handles 422 duplicate barcode response', async () => {
  fetch.mockResolvedValueOnce({ status: 422, json: async () => ({}) });

  render(
    <MemoryRouter>
      <InsertProduct />
    </MemoryRouter>
  );

  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Laptop' } });

  const [priceInput, barcodeInput] = screen.getAllByRole('spinbutton');
  fireEvent.change(priceInput, { target: { value: '999' } });
  fireEvent.change(barcodeInput, { target: { value: '111111111111' } });

  fireEvent.click(screen.getByRole('button', { name: 'Insert' }));

  await waitFor(() => {
    expect(window.alert).toHaveBeenCalledWith(
      'Product is already added with that barcode.'
    );
  });
});
