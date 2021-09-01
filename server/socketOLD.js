class User {
    constructor(id, username, groups) {
        this.id = id
        this.username = username
        this.groups = groups
    }
}

module.exports = {
    connect: function(io, PORT) {
        const users = [
            new User(0, "Jake", ["0", "1"]),
        ]

        var allGroups = [
            {id: "0", name: "CoolG", channels: ["channel1", "channel2"]},
            {id: "1", name: "EpicG", channels: ["channel1", "channel2"]}
        ]

        var rooms = ["room1", "room2", "room3", "room4"]
        var socketRoom = [] // List of socket.id and joined rooms
        var socketRoomNum = [] // How many people in a particular room

        var loggedInUsers = []

        const chat = io.of('/chat')
        chat.on('connection', (socket) => {
            console.log('User connected on port ' + PORT + ' : ' + socket.id)

            var userIndex = loggedInUsers.findIndex((user) => user.id == 0)
            if (userIndex != -1) {
                // If already logged in, just update their socketid
                loggedInUsers[userIndex].socketid = socket.id
                console.log("User already logged in")
            } else {
                // Add user to list of logged in users
                loggedInUsers.push({id: 0, socketid: socket.id})
                console.log("New user")
            }

            console.log(loggedInUsers)

            // When a message comes, emit it back to all sockets in the room with the message
            socket.on('message', (data) => {
                chat.to(data.groupId).emit('message', data.message)
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
                var user = loggedInUsers.find((user) => user.socketid == socket.id)

                // Found the user
                if (user) {
                    // Find their user info
                    var userInfo = users.find((dbUser) => dbUser.id == user.id)

                    // Get group info
                    groupToSend = []
                    for(i = 0; i < userInfo.groups.length; i++) {
                        group = allGroups.find((dbGroup) => dbGroup.id == userInfo.groups[i])
                        groupToSend.push(group)
                    }

                    chat.emit('groupList', JSON.stringify(groupToSend))
                }
            })

            /*
            *   GROUP
            */

            socket.on('groupInfo', (groupId) => {
                var group = allGroups.find((dbGroup) => dbGroup.id == groupId)
                if (group) {
                    chat.emit('groupInfo', JSON.stringify(group))
                }
            })

            /*
            *   OTHER
            */

            socket.on('numUsers', (room) => {
                var userCount = 0;

                for (i = 0; i < socketRoomNum.length; i++) {
                    if(socketRoomNum[i][0] == room) {
                        userCount = socketRoomNum[i][1]
                    }
                }

                chat.in(room).emit('numUsers', userCount)
            })

            socket.on("joinRoom", (room) => {
                if(rooms.includes(room)) {
                    socket.join(room, () => {
                        // Check not already in a room
                        var inRoomSocketArray = false;

                        for(i = 0; i < socketRoom.length; i++) {
                            // Track who is in each room
                            if (socketRoom[i][0] == socket.id) {
                                socketRoom[i][1] = room
                                inRoom = true
                            }
                        }

                        if (inRoomSocketArray == false) {
                            // Add socketid/room record
                            socketRoom.push([socket.id, room])
                            var hasRoomNum = false

                            // Recalculate number of users in a room
                            for (let j = 0; j < socketRoomNum.length; j++) {
                                if(socketRoomNum[j][0] == room) {
                                    socketRoomNum[j][1] = socketRoomNum[j][1] + 1
                                    hasRoomNum = true
                                }
                            }

                            // Start tracking numbers of users in a room if it has no been done before
                            if (hasRoomNum == false) {
                                socketRoomNum.push([room, 1])
                            }
                        }

                        chat.in(room).emit('notice', "A new user has joined")
                    })

                    return chat.in(room).emit('joined', room)
                }
            })

            // Leave a room
            socket.on('leaveRoom', (room) => {
                for(let i = 0; i < socketRoom.length; i++) {
                    if(socketRoom[i][0] == socket.id) {
                        socketRoom.splice(i, 1);
                        socket.leave(room)
                        chat.to(room).emit('notice', "A user has left")
                    }
                }

                for (let j = 0; j < socketRoomNum.length; j++) {
                    if (socketRoomNum[j][0] == room) {
                        socketRoomNum[j][1] = socketRoomNum[j][1] - 1
                        if (socketRoomNum[j][1] == 0) {
                            socketRoomNum.splice(j, 1)
                        }
                    }
                }
            })

            socket.on('disconnect', () => {
                //chat.emit('disconnect')
                for(let i = 0; i < socketRoom.length; i++) {
                    if (socketRoom[i][0] == socket.id) {
                        socketRoom.splice(i, 1)
                    }
                }

                for (let j = 0; j < socketRoomNum.length; j++) {
                    if(socketRoomNum[j][0] == socket.room) {
                        socketRoomNum[j][1] = socketRoomNum[j] - 1
                    }
                }

                console.log("Client disconnected")
            })
        })
    }
}