import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import ReportDashboard from './ReportDashboard';
import { eventBus } from 'authApp/EventBus';

// ---------- Mock ResizeObserver ----------
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverMock;

// ---------- Mock eventBus ----------
jest.mock('authApp/EventBus', () => ({
  eventBus: {
    subscribe: jest.fn((event: string, cb: Function) => {
      // Return an unsubscribe function
      return jest.fn();
    }),
  },
}));

// ---------- Mock sessionStorage & localStorage ----------
const mockStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'sessionStorage', { value: mockStorage });
Object.defineProperty(window, 'localStorage', { value: mockStorage });

describe('ReportDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('renders access denied for non-admin user', () => {
    sessionStorage.setItem('user', JSON.stringify({ userId: 'u1', role: 'customer' }));
    render(<ReportDashboard />);
    expect(screen.getByText(/Access Denied/i)).toBeInTheDocument();
  });

  it('renders dashboard for admin user with bookings', async () => {
    sessionStorage.setItem('user', JSON.stringify({ userId: 'admin1', role: 'admin' }));

    const bookings = [
      { userId: 'user1', seats: [1, 2], timestamp: Date.now() },
      { userId: 'user2', seats: [3], timestamp: Date.now() },
    ];
    localStorage.setItem('bookings', JSON.stringify(bookings));

    render(<ReportDashboard />);

    // Wait for totalTickets state to update
    await waitFor(() => {
      expect(screen.getByText(/Total tickets booked:/i)).toHaveTextContent('Total tickets booked:');
    });

    expect(screen.getByText(/user1: 2 seats/i)).toBeInTheDocument();
    expect(screen.getByText(/user2: 1 seats/i)).toBeInTheDocument();
  });

  it('updates stats when new ticketBooked event is published', async () => {
    sessionStorage.setItem('user', JSON.stringify({ userId: 'admin1', role: 'admin' }));

    // Capture the subscription callback
    let callback: Function = () => {};
    (eventBus.subscribe as jest.Mock).mockImplementation((event: string, cb: Function) => {
      callback = cb;
      return jest.fn(); // unsubscribe
    });

    render(<ReportDashboard />);

    // Publish new booking event
    const newBooking = { userId: 'user3', seats: [4, 5], timestamp: Date.now() };
    act(() => {
      callback(newBooking);
    });

    // Wait for state update
    await waitFor(() => {
      expect(screen.getByText(/Total tickets booked:/i)).toHaveTextContent('Total tickets booked:');
      expect(screen.getByText(/user3: 2 seats/i)).toBeInTheDocument();
    });
  });
});
