# 🛡️ ModernVault: Modern Password Manager

![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white) ![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white) ![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)

A professional, client-side web application built with Vanilla Web Technologies (HTML, CSS, JS) that securely stores and manages passwords using the browser's Local Storage API. 

This project was developed as a comprehensive demonstration of state management, UI/UX design principles, and client-side data handling for a BCA academic presentation.

---

## ✨ Features

### Authentication & Recovery
* **Master Password:** The entire vault is protected behind a single Master Password.
* **First-Time Setup:** Dynamic routing seamlessly guides new users to initialize their vault.
* **Security Questions:** Integrated a robust recovery flow. If the Master Password is forgotten, users can reset it by answering a pre-selected security question. 
* **Session Management:** Utilizes `sessionStorage` to ensure the user must log in again if the browser tab is closed.

### Dashboard Core Functionality
* **CRUD Operations:** Complete Create, Read, Update, and Delete capabilities for saved passwords.
* **Live Search:** Instant, real-time filtering of saved websites using vanilla JavaScript event listeners.
* **Password Strength Meter:** Dynamic visual feedback (Red/Orange/Green) analyzing password complexity as the user types.
* **Copy to Clipboard:** One-click functionality utilizing the `navigator.clipboard` API.
* **Data Obfuscation:** Implements Base64 Encoding (`btoa()`/`atob()`) to obfuscate passwords within the Local Storage and the UI, preventing "shoulder surfing."

### UI/UX Design
* **Glassmorphism Aesthetic:** Premium, modern frosted-glass design elements with soft gradients and deep shadows.
* **Dark Mode Toggle:** Seamless transition between Light and Dark themes, with user preference saved persistently in `localStorage`.
* **Fully Responsive:** CSS Grid and Flexbox layouts ensure the application scales perfectly across desktop and mobile devices.

---

## 🛠️ Architecture & Tech Stack

This project was intentionally built **without frameworks** (like React or Angular) to demonstrate a deep, foundational understanding of DOM manipulation and native browser capabilities.

* **Frontend Structure:** HTML5
* **Styling & Theming:** CSS3 (CSS Variables, Flexbox, Grid, Transitions)
* **Logic & Interactivity:** Vanilla JavaScript (ES6+)
* **Data Persistence:** Web Storage API (`localStorage` & `sessionStorage`)
* **Icons:** FontAwesome

### Data Flow Diagram
The application utilizes a purely local, offline data model. 

1. **Input:** User submits data via the UI forms.
2. **Processing:** JavaScript captures the payload and applies Base64 encoding to sensitive fields.
3. **Storage:** The serialized JSON string is pushed to the browser's `localStorage`.
4. **Retrieval:** Upon successful authentication, the data is parsed, decoded, and rendered to the DOM dynamically.

---

## 🚀 How to Run Locally

Because this application relies entirely on client-side technologies, no local server (like Node.js or XAMPP) is required.

1. Clone the repository:
   ```bash
   git clone [https://github.com/yourusername/securepass.git](https://github.com/yourusername/securepass.git)
   Navigate into the project directory:

Bash
cd securepass
Open index.html directly in your preferred modern web browser (Chrome, Firefox, Edge, Safari).

📚 Educational Notes (BCA Presentation Context)
Security Disclaimer: This application utilizes Base64 encoding for demonstration purposes. In a production environment, sensitive data should never be stored in localStorage due to Cross-Site Scripting (XSS) vulnerabilities, and true encryption algorithms (like AES-GCM via the Web Crypto API) should be utilized alongside a secure backend architecture.

Offline First: By relying entirely on Web Storage APIs, this application is fully functional without an internet connection.

Developed by Himanshu Kumar for the BCA Project Presentation.