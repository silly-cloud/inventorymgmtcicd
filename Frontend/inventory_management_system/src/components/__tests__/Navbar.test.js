import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../Navbar';

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
});

test('renders title prop', () => {
  render(
    <MemoryRouter>
      <Navbar title="IMS" />
    </MemoryRouter>
  );
  expect(screen.getByText('IMS')).toBeInTheDocument();
});

test('renders nav links (Products, About)', () => {
  render(
    <MemoryRouter>
      <Navbar title="IMS" />
    </MemoryRouter>
  );
  expect(screen.getByText('Products')).toBeInTheDocument();
  expect(screen.getByText('About')).toBeInTheDocument();
});
