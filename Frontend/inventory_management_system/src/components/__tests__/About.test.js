import { render, screen } from '@testing-library/react';
import About from '../About';

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
});

test('renders heading text', () => {
  render(<About />);
  expect(
    screen.getByText('Inventory Management System - MERN CRUD App')
  ).toBeInTheDocument();
});
