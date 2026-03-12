# Argon Bot Website 🚀

The official Next.js web dashboard and community hub for **Argon**, the next-generation Discord bot. Built to provide an intuitive interface for managing robust esports tournaments, daily scrims, premium subscriptions, and comprehensive secure server configurations.

## ✨ Features

- **Direct Discord OAuth:** Seamless, secure login flow without relying on third-party auth providers.
- **Server Dashboard:** View all your Discord guilds where Argon is active.
- **Tournament Manager:** Create, edit, and configure brackets and esports settings from the web.
- **Scrims Organization:** Toggle open/closed states, manage slotlists, and configure auto-roles for daily scrims.
- **Ticketing System:** Configure custom support panels and interactive transcript limits.
- **Live Statistics:** Real-time metrics tracking total servers, users, and executed commands directly from the database.
- **Sleek Custom UI:** Built with Tailwind CSS, utilizing a premium `glassmorphism` aesthetic, dynamic animations with Framer Motion, and a custom vibrant purple theme (`bg-primary`).

## 🛠️ Tech Stack

- **Framework:** [Next.js 14+ (App Router)](https://nextjs.org/)
- **Styling:** Tailwind CSS & Framer Motion
- **Database:** MySQL (Endercloud) accessed via `mysql2/promise`
- **Authentication:** Custom Discord OAuth2 with secure HTTP-only JWT Sessions (`jose` library)
- **Icons:** Lucide React

## 🚀 Getting Started

### Prerequisites

You need [Node.js](https://nodejs.org/) installed, as well as a running MySQL database with the Argon schema loaded.

### 1. Environment Variables

Create a `.env.local` file in the root directory and configure the following variables:

```env
# Discord OAuth Requirements
NEXT_PUBLIC_DISCORD_CLIENT_ID=your_discord_bot_client_id
DISCORD_CLIENT_SECRET=your_discord_bot_client_secret
DISCORD_BOT_TOKEN=your_discord_bot_token

# Session Encryption
JWT_SECRET=a_very_long_secure_random_string

# Database Configuration (MySQL)
DB_HOST=your_database_host
DB_PORT=3306
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=your_database_name
```

### 2. Installation

Install the project dependencies using npm:

```bash
npm install
```

### 3. Running the Development Server

Start the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📝 License

This project is proprietary and confidential.
