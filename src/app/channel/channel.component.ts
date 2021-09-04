import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SocketService } from '../services/socket.service';

@Component({
  selector: 'channel',
  templateUrl: './channel.component.html',
  styleUrls: ['./channel.component.css']
})
export class ChannelComponent implements OnInit {
  channel: any | null = null
  members: any | null = null
  groupId: string | null = null
  channelId: string | null = null
  curMessage: string = ""
  messages: any[] = []
  isReady: boolean = false

  constructor(private socketService: SocketService, private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.socketService.getChannelInfo((channelInfo: string[]) => {
      this.channel = channelInfo
    })

    this.socketService.getMemberList((memberList: string[]) => {
      this.members = memberList
    })

    this.socketService.getChannelHistory((channelHistory: string[]) => {
      this.messages = channelHistory
    })

    this.socketService.getMessage((messageData: any) => {
      this.messages.push(messageData)
    })

    this.route.parent?.paramMap.subscribe(params => {
      this.groupId = params.get('groupId')
    })

    this.route.paramMap.subscribe(params => {
      this.channelId = params.get('channelId')
      this.socketService.joinChannel(this.channelId!)
    })

    this.socketService.joinedChannel((msg: string) => {
      this.socketService.reqChannelInfo(this.groupId!, this.channelId!)
      this.socketService.reqMemberList(this.groupId!, this.channelId!)
      this.socketService.reqChannelHistory(this.groupId!, this.channelId!)
      this.isReady = true
    })
  }

  sendMessage() {
    if (this.curMessage != "") {
      this.socketService.sendMessage(this.groupId!, this.channelId!, this.curMessage)
      this.curMessage = ""
    }
  }
}
