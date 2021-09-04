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
    }
  }

  createChannel(newChannel: any) {
    this.socket.emit('newChannel', newChannel)
  }

  // Group List
  reqGroupList() {
    console.log("Requesting group list...")
    this.socket.emit('groupList')
  }

  getGroupList(next: any) {
    this.socket.on('groupList', (res: any) => {
      console.log("Received group list.")
      next(res)
    })
  }

  reqAllGroups() {
    this.socket.emit('groupListAll')
  }

  getAllGroups(next: any) {
    this.socket.on('groupListAll', (res: any) => next(res))
  }

  // Group
  reqGroupInfo(groupId: string) {
    console.log("Requesting group info...")
    this.socket.emit('groupInfo', groupId)
  }

  getGroupInfo(next: any) {
    this.socket.on('groupInfo', (res: any) => {
      console.log("Received group info.")
      next(JSON.parse(res))
    })
  }

  joinChannel(channelId: string): void {
    console.log("Joining group...")
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

  // Channel
  reqChannelInfo(groupId: string, channelId: string): void {
    console.log("Requesting channel information...")
    var location = {
      groupId: groupId,
      channelId: channelId
    }
    this.socket.emit('channelInfo', location)
  }

  getChannelInfo(next: any): void {
    this.socket.on('channelInfo', (channelInfo: any) => {
      console.log("Received channelInfo.")
      next(JSON.parse(channelInfo))
    })
  }

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
