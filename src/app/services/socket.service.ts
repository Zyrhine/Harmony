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

      this.socket.on('refreshChannelList', (groupId: string) => {
        this.reqChannelList(groupId)
      })

      this.socket.on('refreshChannelMembers', (channelId: string) => {
        this.reqChannelMembers(channelId)
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
    this.socket.emit('userList');
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

  reqGroupMembers(groupId: string) {
    this.socket.emit('groupMembers', groupId)
  }

  addGroupMember(groupId: string, email: string) {
    var data = {
      groupId: groupId,
      email: email
    }
    this.socket.emit('addGroupMember', data)
  }

  removeGroupMember(groupId: string, userId: string) {
    var data = {
      groupId: groupId,
      userId: userId
    }
    this.socket.emit('removeGroupMember', data)
  }

  addGroupAssistant(groupId: string, userId: string) {
    var data = {
      groupId: groupId,
      userId: userId
    }
    this.socket.emit('addGroupAssistant', data)
  }

  removeGroupAssistant(groupId: string, userId: string) {
    var data = {
      groupId: groupId,
      userId: userId
    }
    this.socket.emit('removeGroupAssistant', data)
  }

  reqChannelMembers(channelId: string) {
    this.socket.emit('channelMembers', channelId)
  }

  addChannelMember(groupId: string, channelId: string, userId: string) {
    var data = {
      groupId: groupId,
      channelId: channelId,
      userId: userId
    }
    this.socket.emit('addChannelMember', data)
  }

  removeChannelMember(groupId: string, channelId: string, userId: string) {
    var data = {
      groupId: groupId,
      channelId: channelId,
      userId: userId
    }
    this.socket.emit('removeChannelMember', data)
  }

  /*
  *   GROUPS
  */

  reqGroupIndex() {
    this.socket.emit('groupIndex');
  }

  reqGroupList() {
    this.socket.emit('groupList', this.user);
  }

  reqGroupInfo(groupId: string) {
    this.socket.emit('groupInfo', groupId);
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
    this.socket.emit('joinGroup', groupId);
  }


  /*
  *   CHANNELS
  */

  reqChannelList(groupId: string): void {
    var data = {
      groupId: groupId,
      user: this.user
    }
    this.socket.emit('channelList', data)
  }

  createChannel(groupId: string, name: string) {
    var data = {
      groupId: groupId,
      name: name,
      userId: this.user._id
    }

    this.socket.emit('createChannel', data)
  }

  updateChannel(channelData: any) {
    this.socket.emit('updateChannel', channelData)
  }

  deleteChannel(groupId: string, channelId: string) {
    this.socket.emit('deleteChannel', {groupId, channelId})
  }

  // Requests
  joinChannel(channelId: string): void {
    this.socket.emit('joinChannel', channelId)
  }

  leaveChannel(channelId: any): void {
    this.socket.emit('leaveChannel', channelId)
  }

  reqChannelInfo(channelId: string): void {
    this.socket.emit('channelInfo', channelId)
  }

  reqMemberList(groupId: string, channelId: string): void {
    var location = {
      groupId: groupId,
      channelId: channelId
    }
    this.socket.emit('memberList', location)
  }

  reqChannelHistory(groupId: string, channelId: string) {
    var location = {
      groupId: groupId,
      channelId: channelId
    }
    this.socket.emit('channelHistory', location)
  }
  
  sendMessage(groupId: string, channelId: string, message: string, attachments: string[]): void {
    this.socket.emit('message', {'groupId': groupId, 'channelId': channelId, 'userId': this.user._id, 'message': message, 'attachments': attachments})
  }


  // Observables
  onMessage(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('message', (message: any) => observer.next(message));
    })
  }

  onChannelHistory(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('channelHistory', (channelHistory: any) => observer.next(channelHistory));
    })
  }

  onMemberList(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('memberList', (memberList: any) => observer.next(memberList));
    })
  }

  onChannelInfo(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('channelInfo', (channelInfo: any) => observer.next(channelInfo));
    })
  }

  onChannelList(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('channelList', (channelList: any) => observer.next(channelList));
    })
  }

  onGroupInfo(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('groupInfo', (res: any) => observer.next(res));
    })
  }

  onJoinedGroup(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('joinedGroup', () => observer.next());
    })
  }

  onJoinedChannel(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('joinedChannel', () => observer.next());
    })
  }

  onChannelMembers(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('channelMembers', (memberList: any) => observer.next(memberList));
    })
  }

  onNotice(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('notice', (msg: string) => observer.next(msg));
    })
  }

  onUserList(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('userList', (userList: any) => observer.next(userList));
    })
  }

  onGroupList(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('groupList', (groupList: any) => {
        observer.next(groupList)
      });
    })
  }

  onGroupIndex(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('groupIndex', (groupList: any) => observer.next(groupList));
    })
  }

  onGroupMembers(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('groupMembers', (memberList: any) => observer.next(memberList));
    })
  }
}
