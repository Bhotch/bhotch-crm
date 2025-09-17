import { render, screen } from '@testing-library/react';
import App from './App';

// Mock environment variables for tests
process.env.REACT_APP_FIREBASE_API_KEY = 'test-key';
process.env.REACT_APP_GAS_WEB_APP_URL = 'https://test-url.com';
process.env.REACT_APP_GOOGLE_MAPS_API_KEY = 'test-maps-key';

test('renders Bhotch CRM application', () => {
  render(<App />);
  const appElement = screen.getByText(/Bhotch CRM/i);
  expect(appElement).toBeInTheDocument();
});
