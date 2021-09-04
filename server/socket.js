const { ObjectId } = require("mongodb")

module.exports = {
    connect: function(db, io, PORT) {
        var userSessions = []

        const chat = io.of('/chat')
        chat.on('connection', (socket) => {
            // Store the session
            socket.userId = socket.handshake.auth.userId
            socket.userName = socket.handshake.auth.name
            userSessions.push(new Session(socket.id, socket.userId, socket.userName, null))
            console.log(`${socket.userName} : ${socket.id} connected on port ${PORT}`)

            /*
            *   GROUP LIST
            */

            // Send back a list of groups
            socket.on('groupListAll', () => {
                chat.emit('groupListAll', JSON.stringify(rooms))
            })

            // Send back a list of groups the user is in
            socket.on('groupList', () => {
                // Find the groups the user is in and send it back
                const collection = db.collection('groups');
                var oid = new ObjectId(socket.userId);
                collection.find({members: {$elemMatch: {userId: oid}}}).toArray((err, data) => {
                    socket.emit('groupList', JSON.stringify(data));
                })
            })

            /*
            *   GROUP
            */

            socket.on('groupInfo', (groupId) => {
                const collection = db.collection('groups')
                var oid = new ObjectId(groupId)
                collection.findOne({_id: oid}).then(result => {
                    if(result) {
                        chat.emit('groupInfo', JSON.stringify(result));
                      } else {
                        console.log("No document matches the provided query.");
                      }
                })
                .catch(err => console.error(`Failed to find document: ${err}`));
            })

            // Start listening to group
            socket.on('joinChannel', (channelId) => {
                // If user is already in a room, leave it
                var userIndex = userSessions.findIndex((user) => user.socketId == socket.id);
                if (userIndex != -1) {
                    if (userSessions[userIndex].channelId != null) {
                        socket.leave(userSessions[userIndex].channelId)
                        userSessions[userIndex].channelId = null
                    }
                }

                socket.join(channelId);

                // Update their session with the channelId
                var userIndex = userSessions.findIndex((user) => user.socketId == socket.id);
                if (userIndex != -1) {
                    userSessions[userIndex].channelId = channelId;
                }

                chat.in(channelId).emit('joinedChannel');
            })

            // Stop listening to a channel
            socket.on('leaveChannel', (channelId) => {
                socket.leave(channelId);

                // Update their session to remove the channelId
                var userIndex = userSessions.findIndex((user) => user.socketId == socket.id);
                if (userIndex != -1) {
                    userSessions[userIndex].channelId = null;
                }
            })

            /*
            * CHANNEL
            */

            // User has requested to add a new channel
            socket.on('newChannel', (newRoom) => {
                // Check it does not already exist and create it in the database
                if (rooms.indexOf(newRoom) == -1) {
                    rooms.push(newRoom)
                    chat.emit('roomList', JSON.stringify(rooms))
                }
            })

            // Add the message to the database and emit it back to all sockets in the channel
            socket.on('message', (messageData) => {
                // Emit the message
                chat.to(messageData.channelId).emit('message', messageData);

                // Save the message for history
                const collection = db.collection('messages')
                var messageDoc = {
                    'groupId': new ObjectId(messageData.groupId),
                    'channelId': new ObjectId(messageData.channelId),
                    'userId': new ObjectId(socket.userId),
                    'name': messageData.name,
                    'message': messageData.message,
                    'createdAt': new Date()
                }

                collection.insertOne(messageDoc).catch(err => console.error(`Failed to insert message document: ${err}`));
            })

            // Return the information for a channel
            socket.on('channelInfo', (location) => {
                // Get group for channel info
                const collection = db.collection('groups');
                var oid = new ObjectId(location.groupId);
                const query = {_id: oid};

                collection.findOne(query).then(result => { 
                    if (result) {
                        // Get the channel
                        var channelId = new ObjectId(location.channelId);
                        var channel = result.channels.find((channel) => channel._id.equals(channelId));
                        if (channel) {
                            chat.to(location.channelId).emit('channelInfo', JSON.stringify(channel));
                        }
                    } else {
                        console.log("No document matches the provided query.");
                    }
                })
                .catch(err => console.error(`Failed to find document: ${err}`));
            })

            // Return the chat history for a channel 
            socket.on('channelHistory', (location) => {
                // Get group for channel info
                const collection = db.collection('messages');
                var gOid = new ObjectId(location.groupId);
                var cOid = new ObjectId(location.channelId);
                const query = {groupId: gOid, channelId: cOid};

                collection.find(query).sort({"createdAt": -1}).limit(50).toArray().then(channelHistory => {
                    channelHistory.reverse()
                    socket.emit('channelHistory', JSON.stringify(channelHistory));
                }).catch(err => console.error(`Failed to find document: ${err}`))
            })

            // Send the list of online and offline members for a channel
            socket.on('memberList', (location) => {
                // Get group for all possible channel members
                const collection = db.collection('groups')
                var oid = new ObjectId(location.groupId)
                const query = {_id: oid}

                collection.findOne(query).then(result => { 
                    if(result) {
                        // Get the channel
                        var channelId = new ObjectId(location.channelId);
                        var channel = result.channels.find((channel) => channel._id.equals(channelId));
                        if (channel) {
                            // Get online users
                            var usersInChannel = userSessions.filter((user) => user.channelId == location.channelId);

                            // Limit to neccessary information
                            var namesInChannel = pluck(usersInChannel, "name");

                            var memberList = {
                                "onlineMembers": namesInChannel,
                                "offlineMembers": [] // Add this later
                            }

                            chat.to(location.channelId).emit('memberList', JSON.stringify(memberList));
                        }
                    } else {
                        console.log("No document matches the provided query.");
                    }
                })
                .catch(err => console.error(`Failed to find document: ${err}`));
            })

            /*
            *   OTHER
            */
            socket.on('disconnect', () => {
                // Remove their session
                var userIndex = userSessions.findIndex((session) => session.socketId == socket.id)
                if (userIndex != -1) {
                    userSessions.splice(userIndex, 1);
                }

                console.log(`${socket.userName} disconnected`);
            })
        })
    }
}

class Session {
    socketId
    userId
    name
    channelId

    constructor(socketId, userId, name, channelId) {
        this.socketId = socketId
        this.userId = userId
        this.name = name
        this.channelId = channelId
    }
}

function pluck(array, key) {
    return array.map(function(item) { return item[key]; });
}