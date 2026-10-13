// Local testing without any account: dev login and a built in test database. Never use on a live server.
process.env.DEV_MODE = '1';
process.env.PGLITE_DIR = process.env.PGLITE_DIR || require('path').join(__dirname, '.devdb');
require('./server');
