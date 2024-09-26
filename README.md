# webapp
A Node.js cloud-native backend application with a RESTful API, utilizing MySQL and Sequelize ORM. It features a health check endpoint and follows cloud-native standards for educational backend development.

Organisation : CSYE6225 Cloud Computing


To build and deploy the application locally, ensure the following Prerequisites:

#Software Requirements

-Programming Language: Node.js v16.x or higher
-Database: MySQL v8.0.x or higher
-Package Manager: npm v7.x or higher
Git: Git v2.46.1 or higher

#Database Configuration

1) Ensure MySQL is installed and running locally.

2) Create a MySQL database:
CREATE DATABASE webapp;

3) Update the .env file in the root directory with your database connection details:
DB_HOST=localhost
DB_USER=webapp_user
DB_PASSWORD=password
DB_NAME=webapp
PORT=3000


#Project structure:

WEBAPP/
│
├── node_modules/
├── src/
│   ├── config/
│   │   └── dbConfig.js
│   ├── controllers/
│   │   └── healthController.js
│   ├── routes/
|   |   └── healthRoutes.js
│   └-─ app.js
│
├── .env
├── .gitignore
├── package-lock.json
├── package.json
└── README.md


#Build and Deployment Instructions :

-Clone the repository:

    git clone git@github.com:Uttkarsh222/webapp.git
    cd webapp

-Make necessary installations:

    npm install
    npm install sequelize mysql2

-Start the application:

    node src/app.js

#Git Workflow

    -Fork the repository.
    -Work on feature branches and commit changes via pull requests.
    -Do not commit node_modules or other unnecessary files; ensure a       proper .gitignore is in place.


