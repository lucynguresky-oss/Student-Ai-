const fs = require('fs');
const dotenv = require('/home/claude/learnix/node_modules/dotenv');
Object.assign(process.env, dotenv.parse(fs.readFileSync('/home/claude/learnix/.env','utf8')));
process.env.NODE_ENV = 'development';
process.on('uncaughtException', (e) => { fs.writeFileSync('/tmp/oapi-err.txt', 'UNCAUGHT: '+(e && e.stack || e)); process.exit(2); });
process.on('unhandledRejection', (e) => { fs.writeFileSync('/tmp/oapi-err.txt', 'UNHANDLED: '+(e && e.stack || e)); process.exit(3); });
try { require('./dist/openapi-export.js'); }
catch (e) { fs.writeFileSync('/tmp/oapi-err.txt', 'SYNC: '+(e && e.stack || e)); process.exit(4); }
