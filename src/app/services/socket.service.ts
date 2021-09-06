import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io } from "socket.io-client";

const SERVER_URL = 'http://localhost:3000/chat';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private user: any
  private socket: any

  constructor() { }

  initSocket(): void {
    var userString = sessionStorage.getItem("user")
    if (userString) {
      this.user = JSON.parse(userString)
      this.socket = io(SERVER_URL, {
        auth: {
          userId: this.user._id,
          name: this.user.name
        }
      })

      this.socket.on('refreshGroupList', () => {
        this.reqGroupList()
      })
    }
  }

  disconnect() {
    this.socket.close();
  }

  /*
  *   USER ADMINISTRATION
  */

  reqUserList() {
    console.log("Requesting user list...");
    this.socket.emit('userList');
  }

  getUserList(next: any) {
    this.socket.on('userList', (userList: any) => {
      console.log("Received user list.");
      next(JSON.parse(userList));
    });
  }

  createUser(newUser: any) {
    this.socket.emit('createUser', newUser)
  }

  updateUser(user: any) {
    this.socket.emit('updateUser', user)
  }

  deleteUser(userId: string) {
    this.socket.emit('deleteUser', userId)
  }

  promoteUser(userId: string) {
    this.socket.emit('promoteUser', userId)
  }

  /*
  *   GROUPS
  */

  reqGroupIndex() {
    console.log("Requesting group index...");
    this.socket.emit('groupIndex');
  }

  getGroupIndex(next: any) {
    this.socket.on('groupIndex', (groupList: any) => {
      console.log("Received group index.");
      next(JSON.parse(groupList));
    });
  }

  reqGroupList() {
    console.log("Requesting group list...");
    this.socket.emit('groupList');
  }

  getGroupList(next: any) {
    this.socket.on('groupList', (res: any) => {
      console.log("Received group list.");
      next(JSON.parse(res));
    });
  }

  reqGroupInfo(groupId: string) {
    console.log("Requesting group info...");
    this.socket.emit('groupInfo', groupId);
  }

  getGroupInfo(next: any) {
    this.socket.on('groupInfo', (res: any) => {
      console.log("Received group info.");
      next(JSON.parse(res));
    });
  }

  createGroup(name: string) {
    this.socket.emit('createGroup', name);
  }

  updateGroup(groupData: any) {
    this.socket.emit('updateGroup', groupData);
  }

  deleteGroup(groupId: string) {
    this.socket.emit('deleteGroup', groupId);
  }

  joinGroup(groupId: string): void {
    console.log("Joining group...");
    this.socket.emit('joinGroup', groupId);
  }

  joinedGroup(next: any): void {
    this.socket.on('joinedGroup', (res: any) => {
      console.log("Joined group.");
      next(res);
    });
  }


  /*
  *   CHANNELS
  */

  reqChannelList(groupId: string): void {
    console.log("Requesting channel list...")
    this.socket.emit('channelList', groupId)
  }

  getChannelList(next: any): void {
    this.socket.on('channelList', (channelList: any) => {
      console.log("Received channel list.")
      next(JSON.parse(channelList))
    })
  }

  createChannel(groupId: string, name: string) {
    var data = {
      groupId: groupId,
      name: name
    }
    this.socket.emit('createChannel', data)
  }

  updateChannel(channelData: any) {
    this.socket.emit('updateChannel', channelData)
  }

  deleteChannel(groupId:string, channelId: string) {
    this.socket.emit('deleteChannel', {groupId, channelId})
  }

  joinChannel(channelId: string): void {
    console.log("Joining channel...")
    this.socket.emit('joinChannel', channelId)
  }

  joinedChannel(next: any): void {
    this.socket.on('joinedChannel', (res: any) => {
      console.log("Joined channel.")
      next(res)
    })
  }

  leaveChannel(channelId: any): void {
    this.socket.emit('leaveChannel', channelId)
  }

  reqChannelInfo(channelId: string): void {
    console.log("Requesting channel information...")
    this.socket.emit('channelInfo', channelId)
  }

  getChannelInfo(next: any): void {
    this.socket.on('channelInfo', (channelInfo: any) => {
      console.log("Received channelInfo.")
      next(JSON.parse(channelInfo))
    })
  }

  /*
  *   CHANNEL CHAT
  */
  reqMemberList(groupId: string, channelId: string): void {
    console.log("Requesting member list...")
    var location = {
      groupId: groupId,
      channelId: channelId
    }
    this.socket.emit('memberList', location)
  }

  getMemberList(next: any): void {
    this.socket.on('memberList', (memberList: any) => {
      console.log("Received member list.")
      next(JSON.parse(memberList))
    })
  }

  reqChannelHistory(groupId: string, channelId: string) {
    var location = {
      groupId: groupId,
      channelId: channelId
    }
    this.socket.emit('channelHistory', location)
  }

  getChannelHistory(next: any): void {
    this.socket.on('channelHistory', (channelHistory: any) => {
      console.log("Received channel history.")
      next(JSON.parse(channelHistory))
    })
  }

  sendMessage(groupId: string, channelId: string, message: string): void {
    console.log(this.user.name)
    this.socket.emit('message', {'groupId': groupId, 'channelId': channelId, 'name': this.user.name, 'message': message})
  }

  getMessage(next: any) {
    this.socket.on('message', (message: any) => next(message))
  }
}
