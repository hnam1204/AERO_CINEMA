# AERO Cinema

## Online Movie Ticket Booking System

### ASP.NET MVC 5 – Firebase Firestore

---

## 1. Introduction

AERO Cinema is a web-based movie ticket booking system developed to support cinema operations and provide customers with a convenient online booking experience.

The system allows users to search for movies, view showtimes, select seats, complete ticket bookings, manage booking history, and receive electronic tickets. In addition, the platform provides administrative functions for managing movies, showtimes, users, promotions, and transaction records.

The project is implemented using ASP.NET MVC 5 and Firebase Firestore, following the Model–View–Controller architectural pattern and modern web development practices.

---

## 2. Objectives

The primary objectives of this project are:

* Develop a complete online movie ticket booking platform.
* Apply the ASP.NET MVC architecture in a real-world scenario.
* Integrate Firebase Firestore as a cloud-based database solution.
* Provide a responsive user interface across multiple devices.
* Implement user authentication and account management.
* Support secure booking and transaction workflows.
* Improve the efficiency of cinema management operations.

---

## 3. System Features

### 3.1 Customer Features

The system provides the following customer functionalities:

* User registration.
* User authentication.
* Password recovery through OTP verification.
* Movie browsing.
* Movie search.
* Viewing movie details.
* Viewing cinema information.
* Viewing available showtimes.
* Seat selection.
* Ticket booking.
* Payment processing.
* Electronic ticket generation.
* Booking history management.
* User profile management.

### 3.2 Administrative Features

Administrative users can perform the following operations:

* Movie management.
* Cinema management.
* Screening room management.
* Showtime management.
* Banner management.
* Promotion management.
* News management.
* User management.
* Booking management.
* Payment monitoring.
* Activity log monitoring.
* Dashboard reporting.

---

## 4. System Architecture

The system follows the MVC architectural pattern.

```text
Presentation Layer
        │
        ▼
ASP.NET MVC Controllers
        │
        ▼
Business Logic Layer
        │
        ▼
Firebase Firestore
```

Main components include:

* Controllers
* Views
* Models
* Firebase Authentication
* Firebase Firestore
* JavaScript Services
* Responsive User Interface

---

## 5. Technologies Used

### Backend

* ASP.NET MVC 5
* C#
* .NET Framework 4.8

### Database

* Firebase Firestore

### Authentication

* Firebase Authentication
* OTP Verification
* Gmail SMTP Service

### Frontend

* HTML5
* CSS3
* JavaScript ES6
* Bootstrap 5
* Font Awesome

### External Services

* TMDB API
* Gmail SMTP

---

## 6. Database Structure

The Firestore database consists of the following collections:

```text
movies
banners
cinemas
rooms
showtimes
users
bookings
tickets
payments
promotions
news
reviews
activity_logs
app_settings
```

### movies

Stores movie information.

### cinemas

Stores cinema branch information.

### rooms

Stores screening room information.

### showtimes

Stores movie screening schedules and seat configurations.

### users

Stores user accounts and authorization data.

### bookings

Stores ticket booking transactions.

### tickets

Stores issued electronic tickets.

### payments

Stores payment information.

### promotions

Stores promotional campaigns.

### news

Stores news articles and announcements.

### reviews

Stores customer reviews and ratings.

### activity_logs

Stores system activity logs.

### app_settings

Stores global application configuration.

---

## 7. Authentication and Security

The system implements several security mechanisms:

* User authentication using Firebase Authentication.
* OTP verification during account registration.
* OTP verification during password recovery.
* Password complexity validation.
* Firestore Security Rules.
* User ownership validation.
* Role-based access control.
* Protected administrative functions.

---

## 8. Booking Workflow

The booking process consists of the following steps:

1. Select a movie.
2. Select a cinema.
3. Select a screening date.
4. Select a showtime.
5. Select available seats.
6. Confirm booking details.
7. Complete payment.
8. Generate electronic ticket.
9. Save transaction history.

---

## 9. Responsive Design

The user interface has been developed according to Responsive Web Design principles.

Supported devices include:

* Desktop computers.
* Laptop computers.
* Tablets.
* Mobile phones.

The interface automatically adapts to different screen sizes while maintaining usability and consistency.

---

## 10. Installation Guide

### Requirements

* Visual Studio 2022
* .NET Framework 4.8
* Firebase Project
* Firestore Database
* Gmail Application Password

### Setup Procedure

1. Clone the repository.
2. Open the solution in Visual Studio.
3. Configure Firebase credentials.
4. Configure SMTP settings in Web.config.
5. Restore NuGet packages.
6. Build the project.
7. Run the application.

---

## 11. Project Status

Current implementation status:

| Module                   | Status    |
| ------------------------ | --------- |
| Authentication           | Completed |
| Movie Management         | Completed |
| Cinema Management        | Completed |
| Showtime Management      | Completed |
| Seat Selection           | Completed |
| Ticket Booking           | Completed |
| Payment Processing       | Completed |
| User Management          | Completed |
| Responsive Interface     | Completed |
| Administrative Dashboard | Completed |

---

## 12. Future Improvements

Potential future enhancements include:

* Online payment gateway integration.
* QR code validation at cinema entrances.
* Mobile application development.
* Real-time seat synchronization.
* Recommendation system based on user preferences.
* Advanced reporting and analytics.
* Cloud Function automation.

---

## 13. Author

Nguyễn Hoàng Phước Anh

Software Engineering Student

HUFLIT University

---

## 14. License

This project was developed for educational and academic purposes.

All rights reserved.
