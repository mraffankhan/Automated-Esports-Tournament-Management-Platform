# Argon: Automated Esports Tournament Management Platform

Welcome to **Argon**, a comprehensive platform designed to streamline and automate esports tournament management. 

Argon is built to handle the complexities of organizing competitive gaming events, empowering tournament organizers to manage participants, brackets, schedules, and live updates with ease.

## 🚀 Features

*   **Automated Bracketing:** Instantly generate and manage tournament brackets (single elimination, double elimination, round-robin, etc.).
*   **Seamless Registration:** Easy onboarding and registration process for teams and solo players.
*   **Real-time Updates:** Keep participants and spectators informed with live score updates and match status.
*   **Discord Integration:** Connect directly with your Discord community for seamless announcements, role management, and notifications.
*   **Admin Dashboard:** A powerful web interface to oversee all aspects of your tournaments.

## 📁 Repository Structure

*   `argon/`: The core application code (formerly `quotient`). Contains the backend and Discord bot logic.
*   `website/`: The frontend application, featuring the admin dashboard and public-facing tournament pages.

## 🛠️ Getting Started

### Prerequisites

*   Node.js (v16+)
*   Python 3.9+ (For the Discord Bot)
*   A Database (e.g., PostgreSQL, Redis - depending on configuration)

### Setup Instructions

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/mraffankhan/Automated-Esports-Tournament-Management-Platform.git
    cd Automated-Esports-Tournament-Management-Platform
    ```

2.  **Set up the Database and Environment Variables:**
    *   Create a `.env` file based on the provided examples.
    *   Configure your database connections and Discord bot tokens.

3.  **Run the Web Dashboard (`website/`):**
    ```bash
    cd website
    npm install
    npm run dev
    ```

4.  **Run the Discord Bot (`argon/`):**
    ```bash
    cd ../argon
    # It is recommended to use a virtual environment
    python -m venv .venv
    # Activate the environment (source .venv/bin/activate on Linux/Mac, .venv\Scripts\activate on Windows)
    pip install -r requirements.txt
    python main.py
    ```

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests. Ensure your code follows the existing style guidelines.


