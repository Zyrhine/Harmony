const { ObjectId } = require("mongodb")

module.exports = {
    connect: function(db, io, PORT) {
        function getChannelList(groupId, user, next) {
            const collection = db.collection('channels');
            var oid = new ObjectId(groupId);
            if (user.role == 3) {
                query = {groupId: oid, members: new ObjectId(user._id)}
            } else {
                query = {groupId: oid}
            }

            collection.find(query).toArray().then(result => {
                if (result) {
                    next(result)
                } else {
                    console.log("No channels match the provided query.");
                }
            })
            .catch(err => console.error(`Failed to get channel list: ${err}`))
        }

        function getGroupList(userId, next) {
            // Find the groups the user is in and send it back
            const collection = db.collection('groups');
            var oid = new ObjectId(userId);
            collection.find({members: oid}).toArray().then(result => {
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

        function getGroupMembers(groupId, next) {
            const collection = db.collection('groups')
            const agg = [
                {'$match': {'_id': new ObjectId(groupId)}},
                {'$project': {'members': 1}},
                {'$lookup': {
                    'from': 'users', 
                    'localField': 'members', 
                    'foreignField': '_id', 
                    'as': 'members'
                }}];
            collection.aggregate(agg).toArray().then(result => {
                if (result) {
                    if (result[0]) { // Some request issue here to fix later
                        next(result[0].members)
                    }
                } else {
                    console.log("No document matches the provided query.");
                }
            })
        }

        function getChannelMembers(channelId, next) {
            const collection = db.collection('channels')
            const agg = [
                {'$match': {'_id': new ObjectId(channelId)}},
                {'$project': {'members': 1}},
                {'$lookup': {
                    'from': 'users', 
                    'localField': 'members', 
                    'foreignField': '_id', 
                    'as': 'members'
                }}];
            collection.aggregate(agg).toArray().then(result => {
                if (result) {
                    next(result[0].members)
                } else {
                    console.log("No document matches the provided query.");
                }
            })
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
            *   CONTROL PANEL
            */

            // Get all users
            socket.on('userList', () => {
                const collection = db.collection('users');
                collection.find().toArray().then(userList => {
                    socket.emit('userList', JSON.stringify(userList));
                }).catch(err => console.error(`Failed to get user list: ${err}`));
            })

            // Create a new user of role member
            socket.on('createUser', (user) => {
                const collection = db.collection('users');
                userDoc = {
                    email: user.email,
                    password: user.password,
                    name: user.name,
                    role: 3
                }

                collection.insertOne(userDoc).then(() => {
                    // Update their user list
                    collection.find().toArray().then(userList => {
                        socket.emit('userList', JSON.stringify(userList));
                    }).catch(err => console.error(`Failed to get user list: ${err}`));
                }).catch(err => console.error(`Failed to insert new user: ${err}`));
            })

            // Update the details for an existing user
            socket.on('updateUser', (user) => {
                const collection = db.collection('users');
                var oid = new ObjectId(user._id)
                collection.updateOne({_id: oid}, {$set: {email: user.email, password: user.password, name: user.name}}).then(() => {
                    // Update their user list
                    collection.find().toArray().then(userList => {
                        socket.emit('userList', JSON.stringify(userList));
                    }).catch(err => console.error(`Failed to get user list: ${err}`));
                }).catch(err => console.error(`Failed to update user: ${err}`));
            })

            // Delete a user
            socket.on('deleteUser', (userId) => {
                const collection = db.collection('users');
                var oid = new ObjectId(userId)
                collection.deleteOne({_id: oid}).then(() => {
                    // Update their user list
                    collection.find().toArray().then(userList => {
                        socket.emit('userList', JSON.stringify(userList));
                    }).catch(err => console.error(`Failed to get user list: ${err}`));
                }).catch(err => console.error(`Failed to delete user: ${err}`));
            })

            // Promote a user
            socket.on('promoteUser', (userId) => {
                const collection = db.collection('users');
                var oid = new ObjectId(userId)
                collection.updateOne({_id: oid, role: {$gt : 0}}, {$inc: {role: -1} }).then(() => {
                    // Update their user list
                    collection.find().toArray().then(userList => {
                        socket.emit('userList', JSON.stringify(userList));
                    }).catch(err => console.error(`Failed to get user list: ${err}`));
                }).catch(err => console.error(`Failed to update user: ${err}`));
            })

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
                getGroupList(socket.userId, (groupList) => {
                    socket.emit('groupList', JSON.stringify(groupList));
                })
            })

            /*
            *   GROUP
            */

            // Create group with the user
            socket.on('createGroup', (name) => {
                const collection = db.collection('groups')
                var userOid = new ObjectId(socket.userId)
                groupDoc = {
                    name: name,
                    members: [userOid]
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

            socket.on('channelList', ({groupId, user}) => {
                getChannelList(groupId, user, (channelList) => {
                    chat.emit('channelList', JSON.stringify(channelList));
                })
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
                    members: []
                }
                collection.insertOne(channelDoc).then(() => {
                    // Tell everyone in the group to update their channel list
                    chat.to(channel.groupId).emit('refreshChannelList', channel.groupId);
                }).catch(err => console.error(`Failed to insert document: ${err}`));
            })

            // Update a channel with new information
            socket.on('updateChannel', (channel) => {
                const collection = db.collection('channels')
                var oid = new ObjectId(channel._id);
                collection.updateOne({_id: oid}, {$set: {name: channel.name}}).then(() => {
                    // Tell everyone in the group to update their channel list
                    chat.to(channel.groupId).emit('refreshChannelList', channel.groupId);
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
                        // Tell everyone in the group to update their channel list
                        chat.to(groupId).emit('refreshChannelList', groupId);
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

            // Get the list of members in a group
            socket.on('groupMembers', (groupId) => {
                getGroupMembers(groupId, (memberList) => {
                    socket.emit('groupMembers', JSON.stringify(memberList))
                })
            })

            // Add a member to a group
            socket.on('addGroupMember', (data) => {
                const userCollection = db.collection('users')
                const groupCollection = db.collection('groups')
                
                // Find the user being referenced
                userCollection.findOne({email: data.email}).then(user => {
                    if (user) {
                        var oid = new ObjectId(user._id)
                        var gOid = new ObjectId(data.groupId)
                        // Add the user to the member list
                        groupCollection.updateOne({_id: gOid}, {$push: {members: oid}}).then(() => {
                            // Update their member list
                            getGroupMembers(data.groupId, (memberList) => {
                                socket.emit('groupMembers', JSON.stringify(memberList))
                            })
                        })
                    }
                })
            })

            // Remove a member from a group
            socket.on('removeGroupMember', (data) => {
                const collection = db.collection('groups')
                var uOid = new ObjectId(data.userId)
                var gOid = new ObjectId(data.groupId)

                // Remove the user from the member list
                collection.updateOne({_id: gOid}, {$pull: {members: uOid}}).then(() => {
                    // Update their member list
                    getGroupMembers(data.groupId, (memberList) => {
                        socket.emit('groupMembers', JSON.stringify(memberList))
                    })
                })
            })

            // Return the members of a channel
            socket.on('channelMembers', (channelId) => {
                getChannelMembers(channelId, (memberList) => {
                    socket.emit('channelMembers', JSON.stringify(memberList))
                })
            }) 

            // Return the members of a group that are able to be added to a channel
            socket.on('availableChannelMembers', (channelId) => {
                getAvailableChannelMembers(channelId, (memberList) => {
                    socket.emit('availableChannelMembers', JSON.stringify(memberList))
                })
            }) 

            // Add a member to a channel
            socket.on('addChannelMember', ({channelId, userId}) => {
                const collection = db.collection('channels')
                var cOid = new ObjectId(channelId)
                var uOid = new ObjectId(userId)

                // Add the user to the channel member list
                collection.updateOne({_id: cOid}, {$push: {members: uOid}}).then(() => {
                    // Update their channel member list
                    getChannelMembers(channelId, (memberList) => {
                        socket.emit('channelMembers', JSON.stringify(memberList))
                    })
                })
            })

            // Remove a member from a channel
            socket.on('removeChannelMember', ({channelId, userId}) => {
                const collection = db.collection('channels')
                var cOid = new ObjectId(channelId)
                var uOid = new ObjectId(userId)

                // Remove the user from the channel member list
                collection.updateOne({_id: cOid}, {$pull: {members: uOid}}).then(() => {
                    // Update their channel member list
                    getChannelMembers(channelId, (memberList) => {
                        socket.emit('channelMembers', JSON.stringify(memberList))
                    })
                })
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