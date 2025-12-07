const fs = require('fs');
const path = require('path');

const writeFile = (filePath, content) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content.trim());
  console.log(`✅ Created: ${filePath}`);
};

const openApiContent = `
openapi: 3.0.3
info:
  title: Crypto2Bank VERIFY API
  version: 1.0.0
servers:
  - url: https://crypto2bank-api.onrender.com
    description: Production Server
paths:
  /auth/signup:
    post:
      summary: Create a new user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password]
              properties:
                email: { type: string, format: email }
                password: { type: string, minLength: 8 }
      responses:
        '201':
          description: User created
  /auth/login:
    post:
      summary: Login and get JWT
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password]
              properties:
                email: { type: string, format: email }
                password: { type: string }
      responses:
        '200':
          description: Auth token
          content:
            application/json:
              schema:
                type: object
                properties:
                  token: { type: string }
  /bank-accounts:
    post:
      summary: Add a bank account
      security: [{ bearerAuth: [] }]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [routingNumber, accountNumber]
              properties:
                routingNumber: { type: string }
                accountNumber: { type: string }
      responses:
        '201':
          description: Bank account created
  /quote:
    post:
      summary: Get crypto-to-fiat quote
      security: [{ bearerAuth: [] }]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [assetCode, cryptoAmount, payoutType]
              properties:
                assetCode: { type: string, example: "BTC" }
                cryptoAmount: { type: number, example: 0.1 }
                payoutType: { type: string, enum: ["ACH", "INSTANT_DEBIT"] }
      responses:
        '200':
          description: Quote generated
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
`;

writeFile('openapi/crypto2bank.yaml', openApiContent);
console.log("🚀 OPENAPI SPEC GENERATED.");
