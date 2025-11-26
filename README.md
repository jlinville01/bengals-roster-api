# Bengals Roster API

![Alt Text](https://giphy.com/nfl/teams/cincinnati-bengals)

## Setup

### Prerequisites
- Node.js (v14 or higher) - [Download here](https://nodejs.org/)
- npm (comes with Node.js)

### Running Locally

1. **Clone the repository**
   ```bash
   git clone https://github.com/jlinville01/bengals-roster-api.git
   cd bengals-roster-api
   ```

2. **Install dependencies**
   ```bash
   npm init -y
   npm install express
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```
   - The app will be available at `http://localhost:8080`
   
4. **Change directories**
   ```bash
   cd qa
   ```

5. **Install dependencies**
   ```bash
   npm install
   ```

6. **Run automation**
   ```bash
   npx wdio run ./wdio.conf.js
   ```

### Refresh Data
1. **Start the server again**
   ```bash
   npm run dev
   ```
OR
2. **Use the /admin/refresh endpoint (no restart)**
   ```bash
   curl -X POST http://localhost:3000/admin/refresh
   ```

## This project is built with

- Node
- Express
