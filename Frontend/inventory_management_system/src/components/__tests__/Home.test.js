import { render, screen } from '@testing-library/react';
import Home from '../Home';

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
});

test('renders heading text', () => {
  render(<Home />);
  expect(screen.getByText('Go to Products Section.')).toBeInTheDocument();
});
