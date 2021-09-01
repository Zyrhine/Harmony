const { ObjectId } = require("mongodb")

module.exports = {
    connect: function(db, io, PORT) {
        var userSessions = []

        const chat = io.of('/chat')
        chat.on('connection', (socket) => {
            console.log('User connected on port ' + PORT + ' : ' + socket.id)

            socket.on('auth', (data) => {
                var user = JSON.parse(data)
                console.log("Authenticating user...")
                var userIndex = userSessions.findIndex((dbUser) => dbUser.userId == user._id)
                if (userIndex != -1) {
                    // If already logged in, just update their socketid
                    userSessions[userIndex].socketid = socket.id
                    console.log("User already logged in") // Remove this
                } else {
                    // Add user to list of logged in users
                    userSessions.push({userId: user._id, socketid: socket.id})
                    console.log("New user session")
                }

                console.log(userSessions)
            })

            // User has requested to add a new room, check it does not already exist
            socket.on('newRoom', (newRoom) => {
                if (rooms.indexOf(newRoom) == -1) {
                    rooms.push(newRoom)
                    chat.emit('roomList', JSON.stringify(rooms))
                }
            })

            // Send back a list of current rooms [ DEPREC ]
            socket.on('roomList', (m) => {
                chat.emit('roomList', JSON.stringify(rooms))
            })

            /*
            *   GROUP LIST
            */

            // Send back a list of groups
            socket.on('groupListAll', () => {
                chat.emit('groupListAll', JSON.stringify(rooms))
            })

            // Send back a list of groups the user is in
            socket.on('groupList', () => {
                // Get the user
                var user = userSessions.find((user) => user.socketid == socket.id)

                // Found the user
                if (user) {
                    const collection = db.collection('groups')
                    var oid = new ObjectId(user.userId)
                    collection.find({members: {$elemMatch: {userId: oid}}}).toArray((err, data) => {
                        chat.emit('groupList', JSON.stringify(data))
                    })
                }
            })

            /*
            *   GROUP
            */

            socket.on('groupInfo', (groupId) => {
                const collection = db.collection('groups')
                var oid = new ObjectId(groupId)
                collection.findOne({_id: oid}).then(result => {
                    if(result) {
                        console.log(`Successfully found group: ${result}.`);
                        chat.emit('groupInfo', JSON.stringify(result))
                      } else {
                        console.log("No document matches the provided query.");
                      }
                })
                .catch(err => console.error(`Failed to find document: ${err}`))
            })

            // Start listening to group
            socket.on('joinRoom', (groupId) => {
                // If socket isnt already in room, join it
                if(!socket.rooms.has(groupId)) {
                    socket.join(groupId)
                    chat.in(groupId).emit('joined')
                }
            })

            // Stop listening to group
            socket.on('leaveRoom', (groupId) => {
                socket.leave(groupId)
            })

            /*
            * CHANNEL
            */ 

            // When a message comes, emit it back to all sockets in the room with the message
            socket.on('message', (messageData) => {
                chat.to(messageData.groupId).emit('message', messageData)
            })

            // When someone joins, they ask for a memberList, so update everyones memberList
            socket.on('memberList', (data) => {
                const collection = db.collection('groups')
                
                var oid = new ObjectId(data.groupId)
                const query = {_id: oid}
                const options = {
                    // Get only members array
                    projection: { members: 1 }
                }

                collection.findOne(query, options).then(result => { 
                    if(result) {
                        console.log(`Successfully found group: ${result}.`);
                        chat.to(data.groupId).emit('memberList', JSON.stringify(result))
                      } else {
                        console.log("No document matches the provided query.");
                      }
                })
                .catch(err => console.error(`Failed to find document: ${err}`))
            })

            /*
            *   OTHER
            */
            socket.on('disconnect', () => {
                console.log("Client disconnected")
            })
        })
    }
}