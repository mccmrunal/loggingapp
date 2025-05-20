# Logging Application

A multi-database logging application that supports HANA, PostgreSQL, and MySQL databases.

## Local Development Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   # Server
   PORT=5000

   # HANA Database
   HANA_HOST=your_hana_host
   HANA_PORT=your_hana_port
   HANA_USER=your_hana_user
   HANA_PASSWORD=your_hana_password

   # PostgreSQL Database
   PG_HOST=your_pg_host
   PG_PORT=your_pg_port
   PG_USER=your_pg_user
   PG_PASSWORD=your_pg_password
   PG_DATABASE=your_pg_database

   # MySQL Databases
   MYSQL1_HOST=your_mysql1_host
   MYSQL1_PORT=your_mysql1_port
   MYSQL1_USER=your_mysql1_user
   MYSQL1_PASSWORD=your_mysql1_password
   MYSQL1_DATABASE=your_mysql1_database

   MYSQL2_HOST=your_mysql2_host
   MYSQL2_PORT=your_mysql2_port
   MYSQL2_USER=your_mysql2_user
   MYSQL2_PASSWORD=your_mysql2_password
   MYSQL2_DATABASE=your_mysql2_database

   MYSQL3_HOST=your_mysql3_host
   MYSQL3_PORT=your_mysql3_port
   MYSQL3_USER=your_mysql3_user
   MYSQL3_PASSWORD=your_mysql3_password
   MYSQL3_DATABASE=your_mysql3_database
   ```
4. Start the development server:
   ```bash
   npm start
   ```