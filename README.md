# Bengals Roster API

![Bengals](https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDRzZ2p0Z2c5eWRkamRraXdoNG1kbWE5ZmppZHA5b3pqOTh5eWludSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/EgfCSAPCOr5VZ6SZX3/giphy.gif)

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
