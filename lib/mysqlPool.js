const mysql = require('mysql2/promise');

const mysqlHost = process.env.MYSQL_HOST || 'my-mysql-container';
const mysqlPort = process.env.MYSQL_PORT || '3306';
const mysqlDatabase = process.env.MYSQL_DATABASE|| 'mydb';
const mysqlUser = process.env.MYSQL_USER || 'myuser';
const mysqlPassword = process.env.MYSQL_PASSWORD || 'mypassword';

const maxMySQLConnections = 10;
const mysqlPool = mysql.createPool({
    connectionLimit: maxMySQLConnections,
    host: mysqlHost,
    port: mysqlPort,
    database: mysqlDatabase,
    user: mysqlUser,
    password: mysqlPassword
});

module.exports = mysqlPool;