Wager Service

A simple wager management service built with Express.js and MongoDB. Users can create wallets, invite others to wagers, accept or decline wagers, and have payments automatically managed through the system. Admin approval ensures proper handling of wagers and payments.

Features

User Wallets: Users have local wallets to manage funds.

Wager Creation: Users can create and invite others to wagers.

Accept/Decline Wagers: Invited users can accept or decline wagers.

Automatic Deduction: Funds are automatically deducted from wallets when wagers are accepted.

Admin Approval: Wagers require admin approval before proceeding.

Payment on Completion: Once a wager ends, payments are processed automatically.

Tech Stack

Backend: Node.js with Express.js

Database: MongoDB

Authentication: (Add JWT or session details if used)

Installation

Clone the repository:

git clone https://github.com/your-username/wager-service.git
cd wager-service

Install dependencies:

npm install

Configure environment variables:

Create a .env file in the root:

PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key

Start the server:

npm run start

The server will run locally at http://localhost:3000.

API Endpoints
User & Wallet

POST /users – Create a new user

GET /wallet/:userId – Get wallet balance

Wager Management

POST /wagers – Create a new wager

POST /wagers/:id/invite – Invite another user

POST /wagers/:id/accept – Accept a wager (funds deducted)

POST /wagers/:id/decline – Decline a wager

Admin

POST /admin/wagers/:id/approve – Approve wager

POST /admin/wagers/:id/complete – Mark wager as complete and process payment

Workflow

User creates a wallet.

User creates a wager and invites other users.

Invited users accept or decline the wager.

Funds are deducted automatically upon acceptance.

Admin approves the wager.

When the wager ends, payments are processed to the winner(s).

Contributing

Fork the repository

Create a new branch (git checkout -b feature/your-feature)

Make your changes

Commit your changes (git commit -m 'Add feature')

Push to the branch (git push origin feature/your-feature)

Open a Pull Request

License

This project is licensed under the MIT License.
