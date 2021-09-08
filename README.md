<p align="center">
  <h1 align="center">Harmony</h1>
  <p align="center">Real-time chat system</p>
</p>

A chat system implemented using Node.js, Angular, Socket.IO and MongoDB. This system allows for users to communicate with each other in real-time within different groups and channels. Users may be assigned roles for additional permissions.

## Getting Started
1. Clone the repo
```
git clone https://github.com/Zyrhine/Harmony.git
```
2. Install root directory **and** server directory
```
npm install
```
3. Start server in server directory
```
node .
```
4. Launch angular client in root directory
```
ng serve --open
```

## MongoDB
Edit server.js with your MongoDB server details. By default the server will expect a database called 'harmony' with the collections 'users', 'channels', 'groups', 'messages'. To start, insert at least one user with role = 0.
```
_id: ObjectId
email: string
name: string
password: string
role: Int32
```
Importable example database: Coming Soon...