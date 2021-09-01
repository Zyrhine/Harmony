import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io } from "socket.io-client";

const SERVER_URL = 'http://localhost:3000/chat';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: any

  constructor() { }

  initSocket(): void {
    this.socket = io(SERVER_URL)
    this.authenticate()
  }

  authenticate(): void {
    var user = sessionStorage.getItem("user")
    this.socket.emit('auth', user)
  }

  createRoom(newRoom: any) {
    this.socket.emit('newRoom', newRoom)
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

  joinGroupRoom(groupId: string): void {
    console.log("Joining group...")
    this.socket.emit('joinRoom', groupId)
  }

  joined(next: any): void {
    this.socket.on('joined', (res: any) => {
      console.log("Joined group.")
      next(res)
    })
  }

  leaveGroupRoom(groupId: any): void {
    this.socket.emit('leaveRoom', groupId)
  }

  // Channel
  reqMemberList(groupId: string, channelId: string): void {
    console.log("Requesting member list...")
    var data = {
      groupId: groupId,
      channelId: channelId
    }
    this.socket.emit('memberList', data)
  }

  getMemberList(next: any): void {
    this.socket.on('memberList', (memberList: any) => {
      console.log("Received member list.")
      next(JSON.parse(memberList))
    })
  }

  sendMessage(groupId: string, channelId: string, message: string): void {
    this.socket.emit('message', {'groupId': groupId, 'channelId': channelId, 'message': message})
  }

  getMessage(next: any) {
    this.socket.on('message', (message: any) => next(message))
  }
}
