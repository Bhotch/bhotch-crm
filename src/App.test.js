import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Bhotch CRM application', () => {
  render(<App />);
  const appElement = screen.getByText(/Bhotch CRM/i);
  expect(appElement).toBeInTheDocument();
});
