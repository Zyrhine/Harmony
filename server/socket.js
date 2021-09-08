const { ObjectId } = require("mongodb")

module.exports = {
    connect: function(db, io, PORT) {
        // Get a list of channels depending on the user role
        function getChannelList(groupId, user, next) {
            const collection = db.collection('channels');
            var oid = new ObjectId(groupId);
            if (user.role > 1) {
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

        // Get a list of groups that the user is in
        function getGroupList(user, next) {
            const collection = db.collection('groups');
            if (user.role > 1) {
                query = {members: new ObjectId(user._id)}
            } else {
                query = {}
            }
            
            collection.find(query).toArray().then(result => {
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

        // Get the members of a group with their user info
        function getGroupMembers(groupId, next) {
            const collection = db.collection('groups')
            const agg = [
                {'$match': {'_id': new ObjectId(groupId)}},
                {'$project': {'members': 1, 'assistants': 1}},
                {'$lookup': {
                    'from': 'users', 
                    'localField': 'members', 
                    'foreignField': '_id', 
                    'as': 'members'
                }},
                {'$lookup': {
                    'from': 'users', 
                    'localField': 'assistants', 
                    'foreignField': '_id', 
                    'as': 'assistants'
                }}];
            collection.aggregate(agg).toArray().then(result => {
                if (result) {
                    if (result[0]) { // Some request issue here to fix later
                        next(result[0])
                    }
                } else {
                    console.log("No document matches the provided query.");
                }
            })
        }

        // Get the members of a channel
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
                collection.find().sort({role: 1}).toArray().then(userList => {
                    socket.emit('userList', userList);
                }).catch(err => console.error(`Failed to get user list: ${err}`));
            })

            // Create a new user of role member
            socket.on('createUser', (user) => {
                const collection = db.collection('users');
                userDoc = {
                    email: user.email,
                    password: user.password,
                    name: user.name,
                    role: 2
                }

                collection.insertOne(userDoc).then(() => {
                    // Update their user list
                    collection.find().toArray().then(userList => {
                        socket.emit('userList', userList);
                    }).catch(err => console.error(`Failed to get user list: ${err}`));
                }).catch(err => {
                    if (err.code == 11000) {
                        socket.emit('notice', "User already exists");
                    } else {
                        console.error(`Failed to insert new user: ${err}`)
                    }
                });
            })

            // Update the details for an existing user
            socket.on('updateUser', (user) => {
                const collection = db.collection('users');
                var oid = new ObjectId(user._id)
                collection.updateOne({_id: oid}, {$set: {email: user.email, password: user.password, name: user.name}}).then(() => {
                    // Update their user list
                    collection.find().toArray().then(userList => {
                        socket.emit('userList', userList);
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
                        socket.emit('userList', userList);
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
                        socket.emit('userList', userList);
                    }).catch(err => console.error(`Failed to get user list: ${err}`));
                }).catch(err => console.error(`Failed to update user: ${err}`));
            })

            /*
            *   GROUP INDEX
            */

            // Get all groups
            socket.on('groupIndex', () => {
                const collection = db.collection('groups');
                collection.find().toArray().then(groupList => {
                    socket.emit('groupIndex', groupList);
                }).catch(err => console.error(`Failed to get group index: ${err}`));
            })

            /*
            *   GROUP LIST
            */

            // Send back a list of groups the user is in
            socket.on('groupList', (user) => {
                getGroupList(user, (groupList) => {
                    socket.emit('groupList', groupList);
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
                    members: [userOid],
                    assistants: []
                }

                collection.insertOne(groupDoc).then(() => {
                    // Update the group list for the user
                    getGroupList(socket.userId, (groupList) => {
                        socket.emit('groupList', groupList);
                    })
                }).catch(err => console.error(`Failed to insert document: ${err}`));
            })

            // Modify a group with a new name
            socket.on('updateGroup', (group) => {
                const collection = db.collection('groups')
                var oid = new ObjectId(group._id);
                collection.updateOne({_id: oid}, {$set: {name: group.name}}).then(() => {
                    // Update the groupList and groupInfo for everyone in the group room
                    getGroupInfo(group._id, (groupInfo) => {
                        chat.to(group._id).emit('refreshGroupList');
                        chat.to(group._id).emit('groupInfo', groupInfo);
                    })
                }).catch(err => console.error(`Failed to update document: ${err}`));
            })

            // Delete a group
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
                            // TODO: Remove everyone listening to the groups and channels


                            // Tell everyone in the group to refresh their group lists
                            chat.to(groupId).emit('refreshGroupList');
                        }).catch(err => console.error(`Failed to delete group: ${err}`));
                    }).catch(err => console.error(`Failed to delete channels: ${err}`));
                }).catch(err => console.error(`Failed to delete messages: ${err}`));
            })

            // Get the information for a group
            socket.on('groupInfo', (groupId) => {
                const collection = db.collection('groups');
                var oid = new ObjectId(groupId);
                collection.findOne({_id: oid}).then(result => {
                    if (result) {
                        chat.emit('groupInfo', result);
                    } else {
                        console.log("No document matches the provided query.");
                    }
                })
                .catch(err => console.error(`Failed to get group info: ${err}`));
            })

            // Join the room for a group
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

                // If user is already in a channel, leave it
                if (userSessions[userIndex].channelId != null) {
                    socket.leave(userSessions[userIndex].channelId)
                    userSessions[userIndex].channelId = null
                }

                socket.join(groupId);

                // Update their session with the groupId
                userSessions[userIndex].groupId = groupId;

                // Tell them they've joined
                socket.emit('joinedGroup');
            })

            // Leave the room for a group
            socket.on('leaveGroup', (groupId) => {
                socket.leave(groupId);

                // Update their session to remove the groupId
                var userIndex = userSessions.findIndex((user) => user.socketId == socket.id);
                if (userIndex != -1) {
                    userSessions[userIndex].groupId = null;
                }
            })

            // Return the channel list for the user
            socket.on('channelList', ({groupId, user}) => {
                getChannelList(groupId, user, (channelList) => {
                    socket.emit('channelList', channelList);
                })
            })

            // Join the room for a channel
            socket.on('joinChannel', (channelId) => {
                // If user is already in a room, leave it
                var userIndex = userSessions.findIndex((user) => user.socketId == socket.id);
                if (userIndex != -1) {
                    var oldChannelId = userSessions[userIndex].channelId;
                    if (oldChannelId != null) {
                        socket.leave(oldChannelId)
                        userSessions[userIndex].channelId = null

                        // Update leave for other people in channel
                        // Get online users
                        var usersInChannel = userSessions.filter((user) => user.channelId == oldChannelId);
                        // Limit to neccessary information
                        var namesInChannel = pluck(usersInChannel, "name");
                        var memberList = {
                            "onlineMembers": namesInChannel,
                            "offlineMembers": [] // Add this later
                        }

                        chat.to(oldChannelId).emit('memberList', memberList);
                    }
                }

                socket.join(channelId);

                // Update their session with the channelId
                var userIndex = userSessions.findIndex((user) => user.socketId == socket.id);
                if (userIndex != -1) {
                    userSessions[userIndex].channelId = channelId;
                }

                socket.emit('joinedChannel');
            })

            // Leave the room for a channel
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
            socket.on('createChannel', ({groupId, name, userId}) => {
                console.log(userId)
                const collection = db.collection('channels')
                channelDoc = {
                    groupId: new ObjectId(groupId),
                    name: name,
                    members: [new ObjectId(userId)]
                }
                collection.insertOne(channelDoc).then(() => {
                    // Tell everyone in the group to update their channel list
                    chat.to(groupId).emit('refreshChannelList', groupId);
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
                        chat.to(channelId).emit('channelInfo', channelInfo);
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
                    socket.emit('channelHistory', channelHistory);
                }).catch(err => console.error(`Failed to find channelHistory document: ${err}`))
            })

            // Get the list of members in a group
            socket.on('groupMembers', (groupId) => {
                getGroupMembers(groupId, (memberList) => {
                    socket.emit('groupMembers', memberList)
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
                        groupCollection.updateOne({_id: gOid}, {$addToSet: {members: oid}}).then(() => {
                            // Update the requester's member list
                            getGroupMembers(data.groupId, (memberList) => {
                                socket.emit('groupMembers', memberList)

                                // Tell the person added to refresh their list
                                var session = userSessions.find((session) => session.userId == user._id)
                                if (session) {
                                    chat.in(session.socketId).emit('refreshGroupList')
                                }
                            })
                        })
                    }
                })
            })

            // Remove a member from a group
            socket.on('removeGroupMember', ({groupId, userId}) => {
                const collection = db.collection('groups');
                var gOid = new ObjectId(groupId);
                var uOid = new ObjectId(userId);

                // Remove the user from the member list
                collection.updateOne({_id: gOid}, {$pull: {members: uOid}}).then(() => {
                    // Update the requester's member list
                    getGroupMembers(groupId, (memberList) => {
                        socket.emit('groupMembers', memberList)

                        // Tell the person removed to refresh their list
                        var session = userSessions.find((session) => session.userId == userId)
                        if (session) {
                            chat.in(session.socketId).emit('refreshGroupList')
                        }
                    })
                })
            })

            // Add an assistant for a group
            socket.on('addGroupAssistant', ({groupId, userId}) => {
                const collection = db.collection('groups');
                var gOid = new ObjectId(groupId);
                var uOid = new ObjectId(userId);

                // Add the user to the assistant list
                collection.updateOne({_id: gOid}, {$addToSet: {assistants: uOid}}).then(() => {
                    // Update the requester's member list
                    getGroupMembers(groupId, (memberList) => {
                        socket.emit('groupMembers', memberList)

                        // Tell the person added to refresh their list
                        var session = userSessions.find((session) => session.userId == userId)
                        if (session) {
                            chat.in(session.socketId).emit('refreshGroupList')
                        }
                    })
                })
            })

            // Remove an assistant for a group
            socket.on('removeGroupAssistant', ({groupId, userId}) => {
                const collection = db.collection('groups');
                var gOid = new ObjectId(groupId);
                var uOid = new ObjectId(userId);

                // Remove the user from the assistant list
                collection.updateOne({_id: gOid}, {$pull: {assistants: uOid}}).then(() => {
                    // Update the requester's member list
                    getGroupMembers(groupId, (memberList) => {
                        socket.emit('groupMembers', memberList)

                        // Tell the person removed to refresh their list
                        var session = userSessions.find((session) => session.userId == userId)
                        if (session) {
                            chat.in(session.socketId).emit('refreshGroupList')
                        }
                    })
                })
            })

            // Return the members of a channel
            socket.on('channelMembers', (channelId) => {
                getChannelMembers(channelId, (memberList) => {
                    socket.emit('channelMembers', memberList)
                })
            }) 

            // Return the members of a group that are able to be added to a channel
            socket.on('availableChannelMembers', (channelId) => {
                getAvailableChannelMembers(channelId, (memberList) => {
                    socket.emit('availableChannelMembers', memberList)
                })
            }) 

            // Add a member to a channel
            socket.on('addChannelMember', ({groupId, channelId, userId}) => {
                const collection = db.collection('channels')
                var cOid = new ObjectId(channelId)
                var uOid = new ObjectId(userId)

                // Add the user to the channel member list
                collection.updateOne({_id: cOid}, {$addToSet: {members: uOid}}).then(() => {
                    // Update their channel member list
                    getChannelMembers(channelId, (memberList) => {
                        socket.emit('channelMembers', memberList)
                    })
                    
                    // Tell the group to update their channel lists
                    chat.in(groupId).emit('refreshChannelList', groupId)
                })
            })

            // Remove a member from a channel
            socket.on('removeChannelMember', ({groupId, channelId, userId}) => {
                const collection = db.collection('channels')
                var cOid = new ObjectId(channelId)
                var uOid = new ObjectId(userId)

                // Remove the user from the channel member list
                collection.updateOne({_id: cOid}, {$pull: {members: uOid}}).then(() => {
                    // Update their channel member list
                    getChannelMembers(channelId, (memberList) => {
                        socket.emit('channelMembers', memberList)
                    })

                    // Tell the group to update their channel lists
                    chat.in(groupId).emit('refreshChannelList', groupId)
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

                        chat.to(location.channelId).emit('memberList', memberList);
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