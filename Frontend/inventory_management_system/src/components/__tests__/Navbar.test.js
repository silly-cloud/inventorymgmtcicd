import { render, screen } from '@testing-library/react';
import Navbar from '../Navbar';

// Navbar uses plain <a> tags, no react-router-dom hooks — no MemoryRouter needed.

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
});

test('renders title prop', () => {
  render(<Navbar title="IMS" />);
  expect(screen.getByText('IMS')).toBeInTheDocument();
});

test('renders nav links (Products, About)', () => {
  render(<Navbar title="IMS" />);
  expect(screen.getByText('Products')).toBeInTheDocument();
  expect(screen.getByText('About')).toBeInTheDocument();
});
