const fs = require('fs');
const path = require('path');

// Check if environment variables are present
const requiredEnvVars = [
  'AZURE_AD_CLIENT_ID',
  'AZURE_AD_CLIENT_SECRET',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars);
  process.exit(1);
}

// Create .env.production file from environment variables
const envContent = requiredEnvVars
  .map(varName => `${varName}=${process.env[varName]}`)
  .join('\n');

fs.writeFileSync(path.join(process.cwd(), '.env.production'), envContent);

console.log('Production environment variables set successfully!');
