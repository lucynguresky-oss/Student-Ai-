const fs = require('fs');
const content = fs.readFileSync('apps/api/prisma/schema.prisma', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('model Post ') || line.includes('model Post{') || line.includes('model Post {')) {
    console.log(`Found Post at line ${idx + 1}: ${line}`);
  }
});
