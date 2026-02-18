import { render, screen } from '@testing-library/react';
import App from './App';

test('renders app with navbar title', () => {
  render(<App />);
  expect(screen.getByText('IMS')).toBeInTheDocument();
});
