# Waste-to-Resources

## Setup
1. `npm install`
2. Create a Firebase project -> enable **Authentication (Email/Password)** and **Firestore**.
3. Copy `.env.example` to `.env` and paste your Firebase web app keys.
4. Paste `firestore.rules` into Firestore -> Rules -> Publish.
5. `npm run dev`

## Make yourself admin
Register normally, then in Firebase Console -> Firestore -> `users/<your uid>` set `role` = `admin`.
(Users cannot do this themselves; the rules block it.)
