const { ObjectId } = require("mongodb")

module.exports = {
    connect: function(db, io, PORT) {
        function getChannelList(groupId, next) {
            const collection = db.collection('channels');
            var oid = new ObjectId(groupId);
            collection.find({groupId: oid}).toArray().then(result => {
                if (result) {
                    next(result)
                } else {
                    console.log("No document matches the provided query.");
                }
            })
            .catch(err => console.error(`Failed to get channel list: ${err}`))
        }

        function getGroupList(userId, next) {
            // Find the groups the user is in and send it back
            const collection = db.collection('groups');
            var oid = new ObjectId(userId);
            collection.find({members: {$elemMatch: {userId: oid}}}).toArray().then(result => {
                if (result) {
                    next(result)
                } else {
                    console.log("No document matches the provided query.");
                }
            })
            .catch(err => console.error(`Failed to get group list: ${err}`))
        }

        // Get the document for a group
        function getGroupInfo(groupId, next) {
            const collection = db.collection('groups');
            var oid = new ObjectId(groupId);
            return collection.findOne({_id: oid}).then(result => {
                if (result) {
                   next(result)
                } else {
                    console.log("No document matches the provided query.");
                }
            })
            .catch(err => console.error(`Failed to get group info: ${err}`));
        }

        var userSessions = []

        const chat = io.of('/chat')
        chat.on('connection', (socket) => {
            // Store the session
            socket.userId = socket.handshake.auth.userId
            socket.userName = socket.handshake.auth.name
            userSessions.push(new Session(socket.id, socket.userId, socket.userName, null, null))
            console.log(`${socket.userName} : ${socket.id} connected on port ${PORT}`)

            /*
            *   GROUP INDEX
            */

            socket.on('groupIndex', () => {
                // Get all available groups
                const collection = db.collection('groups');
                collection.find().toArray().then(groupList => {
                    socket.emit('groupIndex', JSON.stringify(groupList));
                }).catch(err => console.error(`Failed to get group index: ${err}`));
            })

            /*
            *   GROUP LIST
            */

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

            socket.on('createGroup', (name) => {
                const collection = db.collection('groups')
                var userOid = new ObjectId(socket.userId)
                groupDoc = {
                    name: name,
                    members: [{userId: userOid, roles: []}],
                    roles: []
                }

                collection.insertOne(groupDoc).then(() => {
                    // Update the group list for the user
                    getGroupList(socket.userId, (groupList) => {
                        socket.emit('groupList', JSON.stringify(groupList));
                    })
                }).catch(err => console.error(`Failed to insert document: ${err}`));
            })

            socket.on('updateGroup', (group) => {
                const collection = db.collection('groups')
                var oid = new ObjectId(group._id);
                collection.updateOne({_id: oid}, {$set: {name: group.name}}).then(() => {
                    // Update the groupInfo for everyone in the group room
                    getGroupInfo(group._id, (groupInfo) => {
                        chat.to(group._id).emit('groupInfo', JSON.stringify(groupInfo));
                    })
                }).catch(err => console.error(`Failed to update document: ${err}`));
            })

            socket.on('deleteGroup', (groupId) => {
                // Delete all group messages
                const messagesCollection = db.collection('messages')
                const channelsCollection = db.collection('channels')
                const groupsCollection = db.collection('groups')
                var oid = new ObjectId(groupId);

                // Delete all channel messages
                messagesCollection.deleteMany({groupId: oid}).then(() => {
                    // Delete all group channels
                    channelsCollection.deleteMany({groupId: oid}).then(() => {
                        // Delete the group
                        groupsCollection.deleteOne({_id: oid}).then(() => {
                            // Remove everyone listening to the groups and channels


                            // Tell everyone in the group to refresh their group lists
                            chat.to(groupId).emit('refreshGroupList');
                        }).catch(err => console.error(`Failed to delete group: ${err}`));
                    }).catch(err => console.error(`Failed to delete channels: ${err}`));
                }).catch(err => console.error(`Failed to delete messages: ${err}`));
            })


            socket.on('groupInfo', (groupId) => {
                const collection = db.collection('groups');
                var oid = new ObjectId(groupId);
                collection.findOne({_id: oid}).then(result => {
                    if (result) {
                        chat.emit('groupInfo', JSON.stringify(result));
                    } else {
                        console.log("No document matches the provided query.");
                    }
                })
                .catch(err => console.error(`Failed to get group info: ${err}`));
            })

            // Start listening to group
            socket.on('joinGroup', (groupId) => {
                // Get the user session
                var userIndex = userSessions.findIndex((user) => user.socketId == socket.id);
                if (userIndex == -1) {
                    return
                }

                // If user is already in a group, leave it
                if (userSessions[userIndex].groupId != null) {
                    socket.leave(userSessions[userIndex].groupId)
                    userSessions[userIndex].groupId = null
                }

                socket.join(groupId);

                // Update their session with the groupId
                userSessions[userIndex].groupId = groupId;

                chat.in(groupId).emit('joinedGroup');
            })

            // Stop listening to a group
            socket.on('leaveGroup', (groupId) => {
                socket.leave(groupId);

                // Update their session to remove the groupId
                var userIndex = userSessions.findIndex((user) => user.socketId == socket.id);
                if (userIndex != -1) {
                    userSessions[userIndex].groupId = null;
                }
            })

            socket.on('channelList', (groupId) => {
                const collection = db.collection('channels');
                var oid = new ObjectId(groupId);
                collection.find({groupId: oid}).toArray().then(result => {
                    if (result) {
                        chat.emit('channelList', JSON.stringify(result));
                    } else {
                        console.log("No document matches the provided query.");
                    }
                })
                .catch(err => console.error(`Failed to get channel list: ${err}`));
            })

            // Start listening to channel
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
            socket.on('createChannel', (channel) => {
                const collection = db.collection('channels')
                channelDoc = {
                    groupId: new ObjectId(channel.groupId),
                    name: channel.name,
                    roles: []
                }
                collection.insertOne(channelDoc).then(() => {
                    // Update the channel list for everyone in the group
                    getChannelList(channel.groupId, (channelList) => {
                        chat.to(channel.groupId).emit('channelList', JSON.stringify(channelList));
                    })
                }).catch(err => console.error(`Failed to insert document: ${err}`));
            })

            // Update a channel with new information
            socket.on('updateChannel', (channel) => {
                const collection = db.collection('channels')
                var oid = new ObjectId(channel._id);
                collection.updateOne({_id: oid}, {$set: {name: channel.name}}).then(() => {
                    // Update the channel list for everyone in the group
                    getChannelList(channel.groupId, (channelList) => {
                        chat.to(channel.groupId).emit('channelList', JSON.stringify(channelList));
                    })
                }).catch(err => console.error(`Failed to update document: ${err}`));
            })

            // Delete a channel
            socket.on('deleteChannel', ({groupId, channelId}) => {
                const messagesCollection = db.collection('messages')
                const channelsCollection = db.collection('channels')
                var oid = new ObjectId(channelId);

                // Delete all channel messages
                messagesCollection.deleteMany({channelId: oid}).then(() => {
                    // Delete the channel
                    channelsCollection.deleteOne({_id: oid}).then(() => {
                        // Update the channel list for everyone in the group
                        getChannelList(groupId, (channelList) => {
                            chat.to(groupId).emit('channelList', JSON.stringify(channelList));
                        })
                    }).catch(err => console.error(`Failed to delete the channel: ${err}`));
                }).catch(err => console.error(`Failed to delete channel messages: ${err}`));
            })

            // Add the message to the database and emit it back to all sockets in the channel
            socket.on('message', (messageData) => {
                // Emit the message
                chat.to(messageData.channelId).emit('message', messageData);

                // Save the message for history
                const collection = db.collection('messages')
                var messageDoc = {
                    groupId: new ObjectId(messageData.groupId),
                    channelId: new ObjectId(messageData.channelId),
                    userId: new ObjectId(socket.userId),
                    name: messageData.name,
                    message: messageData.message,
                    createdAt: new Date()
                }

                collection.insertOne(messageDoc).catch(err => console.error(`Failed to insert message document: ${err}`));
            })

            // Return the information for a channel
            socket.on('channelInfo', (channelId) => {
                // Get group for channel info
                const collection = db.collection('channels');
                var oid = new ObjectId(channelId);
                const query = {_id: oid};

                collection.findOne(query).then(channelInfo => { 
                    if (channelInfo) {
                        chat.to(channelId).emit('channelInfo', JSON.stringify(channelInfo));
                    } else {
                        console.log("No document matches the provided query.");
                    }
                })
                .catch(err => console.error(`Failed to get channel info: ${err}`));
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
                }).catch(err => console.error(`Failed to find channelHistory document: ${err}`))
            })

            // Send the list of online and offline members for a channel
            socket.on('memberList', (location) => {
                // Get group for all possible channel members
                const channelCollection = db.collection('channels')
                const groupCollection = db.collection('groups')
                var cOid = new ObjectId(location.channelId)
                var gOid = new ObjectId(location.groupId)
                const channelQuery = {_id: cOid}
                const groupQuery = {_id: gOid}

                // Get the channel for the required roles
                channelCollection.findOne(channelQuery).then(result => { 
                    if(result) {
                        // TODO: Get offline users based on possible users in group's members

                        // Get online users
                        var usersInChannel = userSessions.filter((user) => user.channelId == location.channelId);

                        // Limit to neccessary information
                        var namesInChannel = pluck(usersInChannel, "name");

                        var memberList = {
                            "onlineMembers": namesInChannel,
                            "offlineMembers": [] // Add this later
                        }

                        chat.to(location.channelId).emit('memberList', JSON.stringify(memberList));
                    } else {
                        console.log("No document matches the provided query.");
                    }
                })
                .catch(err => console.error(`Failed to get member list: ${err}`));
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
    constructor(socketId, userId, name, groupId, channelId) {
        this.socketId = socketId
        this.userId = userId
        this.name = name
        this.groupId = groupId
        this.channelId = channelId
    }
}

function pluck(array, key) {
    return array.map(function(item) { return item[key]; });
}