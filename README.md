# UHARMS (Unified Healthcare Appointment & Records Management System)

## 📌 Overview

UHARMS is a full-stack healthcare management system designed to streamline appointment booking, communication, and administrative workflows between patients, doctors, and administrators.

The system consists of:

* A **mobile application** for patients and doctors
* A **web-based admin dashboard**
* A **backend API** handling business logic and data flow

---

## 🧱 Architecture

```
UHARMS/
├── frontend/           # React Native mobile app
├── backend/            # Node.js + Express API
├── admin_dashboard/    # React.js web dashboard
```

---

## ⚙️ Tech Stack

### 📱 Frontend (Mobile App)

* React Native
* React Navigation
* Axios

### 🌐 Admin Dashboard

* React.js
* Material UI (or any UI library you're using)

### 🖥️ Backend

* Node.js
* Express.js

### 🗄️ Database

* MongoDB (NoSQL)

---

## 🚀 Features

### 👤 Patient

* Book appointments with doctors
* View appointment history
* Real-time messaging with doctors

### 🩺 Doctor

* Manage availability
* View and manage appointments
* Communicate with patients

### 🛠️ Admin (Web Dashboard)

* Manage users (patients & doctors)
* Monitor appointments
* System-level controls and analytics

---

## 🔌 API Structure

* RESTful API built with Express
* Handles:

  * Authentication & authorization
  * Appointment management
  * Messaging system
  * User management

---

## 🛠️ Installation & Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Chirchirjeff/UHARMS.git
cd UHARMS
```

---

### 2️⃣ Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file and add:

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

Run backend:

```bash
npm start
```

---

### 3️⃣ Frontend (React Native)

```bash
cd frontend
npm install
```

Run app:

```bash
npx react-native run-android
```

---

### 4️⃣ Admin Dashboard (React.js)

```bash
cd admin_dashboard
npm install
npm start
```

---

## 🔐 Environment Variables

Each service may require environment variables:

### Backend

* `MONGO_URI`
* `JWT_SECRET`
* `PORT`

---

## 📡 Future Improvements

* Real-time notifications (WebSockets)
* Payment integration
* Advanced analytics dashboard
* AI-based health insights

---

## 🤝 Contribution

Contributions are welcome. Feel free to fork the repository and submit a pull request.

---

## 📄 License

This project is open-source and available under the MIT License.

---

## 👨‍💻 Author

**Jeff Chirchir**

---

## 📌 Notes

* Ensure MongoDB is running locally or use a cloud instance.
* Mobile app requires Android Studio or a configured emulator/device.
* Keep `.env` files private and never push them to GitHub.

---
