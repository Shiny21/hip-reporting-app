import React, { useEffect, useState } from "react";
import { eventBus } from "authApp/EventBus"; // fallback handled in try/catch
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface Booking {
  userId: string;
  seats: number[];
  timestamp: number;
}

interface User {
  userId: string;
  role: string;
  permissions?: string[];
}

const BOOKING_STORAGE_KEY = "bookings";

const ReportDashboard: React.FC = () => {
  const [totalTickets, setTotalTickets] = useState(0);
  const [bookingsPerUser, setBookingsPerUser] = useState<
    { user: string; count: number }[]
  >([]);
  const [bookingsPerHour, setBookingsPerHour] = useState<
    { hour: string; count: number }[]
  >([]);
  const [user, setUser] = useState<User | null>(null);

  // ---------- Helpers ----------
  const loadBookings = (): Booking[] => {
    const saved = localStorage.getItem(BOOKING_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  };

  const calculateStats = (allBookings: Booking[]) => {
    // total
    const total = allBookings.reduce((acc, b) => acc + b.seats.length, 0);
    setTotalTickets(total);

    // per user
    const groupedByUser: Record<string, number> = {};
    allBookings.forEach((b) => {
      const u = b.userId || "unknown";
      groupedByUser[u] = (groupedByUser[u] || 0) + b.seats.length;
    });
    setBookingsPerUser(
      Object.keys(groupedByUser).map((u) => ({ user: u, count: groupedByUser[u] }))
    );

    // per hour
    const groupedByHour: Record<string, number> = {};
    allBookings.forEach((b) => {
      const date = new Date(b.timestamp);
      const hour = `${date.getHours()}:00`;
      groupedByHour[hour] = (groupedByHour[hour] || 0) + b.seats.length;
    });
    setBookingsPerHour(
      Object.keys(groupedByHour).map((h) => ({ hour: h, count: groupedByHour[h] }))
    );
  };

  // ---------- Setup ----------
  useEffect(() => {
    // 1. Load current user from sessionStorage
    const savedUser = sessionStorage.getItem("user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        console.warn("Invalid user data in sessionStorage");
      }
    }

    // 2. Load bookings
    calculateStats(loadBookings());

    // 3. Subscribe to booking events
    let unsubscribe = () => {};
    try {
      unsubscribe = eventBus.subscribe("ticketBooked", (payload: Booking) => {
        const saved = loadBookings();
        const updated = [...saved, payload];
        localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(updated));
        calculateStats(updated);
      });
    } catch {
      console.warn("eventBus not available (standalone mode)");
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // ---------- Restriction ----------
  const canViewReports =
    user?.role === "admin" || user?.role === "manager";

  if (!canViewReports) {
    return (
      <div style={{ padding: "20px", color: "red" }}>
        <h3>Access Denied</h3>
        <p>You do not have permission to view reports.</p>
      </div>
    );
  }

  // ---------- Render ----------
  return (
    <div style={{ padding: "20px" }}>
      <h2>Report Dashboard</h2>

      <p>
        <strong>Total tickets booked:</strong> {totalTickets}
      </p>

      <h3>Bookings per User</h3>
      <ul>
        {bookingsPerUser.map((item, idx) => (
          <li key={idx}>
            {item.user}: {item.count} seats
          </li>
        ))}
      </ul>

      <h3>Bookings per Hour</h3>
      {bookingsPerHour.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={bookingsPerHour}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#8884d8" name="Seats Booked" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p>No booking data yet.</p>
      )}
    </div>
  );
};

export default ReportDashboard;
