# Report Micro-Frontend

## Overview
The Report Micro-Frontend is a React-based application that provides comprehensive booking analytics and reporting functionality within a micro-frontend architecture. It integrates with the **Booking Micro-Frontend** to display real-time statistics and visualizations of seat booking data.

## Features
- **Real-time Analytics:** Live updates of booking statistics via event bus.  
- **Role-Based Access Control:** Restricted to admin and manager roles only.  
- **Data Visualization:** Interactive charts showing bookings per hour.  
- **User Statistics:** Detailed breakdown of bookings per user.  
- **Total Metrics:** Aggregate ticket booking counts.  
- **Error Handling:** Graceful degradation when dependencies are unavailable.

## Data Flow
- **Data Source:** Pulls booking data from `localStorage` (`bookings` key).  
- **Real-time Updates:** Subscribes to `ticketBooked` events via event bus.  
- **Data Processing:** Calculates statistics on component mount and event updates.  
- **Access Control:** Validates user permissions from `sessionStorage`.  

## Integration Points

### Event Bus Communication
The Report Micro-Frontend integrates with the event system for real-time updates.

#### Subscribed Events
- **ticketBooked:** Receives new booking data for real-time dashboard updates.
