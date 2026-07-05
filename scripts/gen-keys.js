const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

function generateKeys() {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });

  const kid = `key-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
  const privateEscaped = privateKey.trim().replace(/\r?\n/g, '\\n');
  const publicEscaped = publicKey.trim().replace(/\r?\n/g, '\\n');

  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    // If .env doesn't exist, copy from .env.example
    const examplePath = path.join(__dirname, '..', '.env.example');
    if (fs.existsSync(examplePath)) {
      fs.copyFileSync(examplePath, envPath);
    } else {
      fs.writeFileSync(envPath, '');
    }
  }

  let envContent = fs.readFileSync(envPath, 'utf8');

  // Replace or append
  const lines = envContent.split(/\r?\n/);
  const updatedLines = [];
  let foundKid = false;
  let foundPrivate = false;
  let foundPublic = false;

  for (const line of lines) {
    if (line.startsWith('JWT_KID=')) {
      updatedLines.push(`JWT_KID=${kid}`);
      foundKid = true;
    } else if (line.startsWith('JWT_PRIVATE_KEY=')) {
      updatedLines.push(`JWT_PRIVATE_KEY="${privateEscaped}"`);
      foundPrivate = true;
    } else if (line.startsWith('JWT_PUBLIC_KEY=')) {
      updatedLines.push(`JWT_PUBLIC_KEY="${publicEscaped}"`);
      foundPublic = true;
    } else {
      updatedLines.push(line);
    }
  }

  if (!foundKid) updatedLines.push(`JWT_KID=${kid}`);
  if (!foundPrivate) updatedLines.push(`JWT_PRIVATE_KEY="${privateEscaped}"`);
  if (!foundPublic) updatedLines.push(`JWT_PUBLIC_KEY="${publicEscaped}"`);

  fs.writeFileSync(envPath, updatedLines.join('\n'), 'utf8');
  console.log(`Generated RS256 keypair successfully. KID: ${kid}`);
}

generateKeys();
