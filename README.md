<h1 align="center">Serverless Certificate</h1>

## Project

The project is responsible for generating a certificate for a user and the possibility of searching the validity of a certificate

## How to run locally

- Clone the repository and access it
- Run `npm install --save` to install all the dependencies
- Run `npm run dynamodb:install` to install DynamoDB
- Run `npm run dynamodb:start` to start a new database
- Run `npm run start:dev` to start the application

## How to deploy

- Run `npm run deploy` to deploy the functions `generateCertificate` and `verifyCertificate` to AWS Lambda
- After, you can use the provided url to make the requests
