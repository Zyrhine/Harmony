import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SocketService } from '../services/socket.service';

@Component({
  selector: 'channel',
  templateUrl: './channel.component.html',
  styleUrls: ['./channel.component.css']
})
export class ChannelComponent implements OnInit {
  groupId: string | null = null
  channelId: string | null = null
  curMessage: string = ""
  messages: any[] = []
  members: any[] | null = null

  constructor(private socketService: SocketService, private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.route.parent?.paramMap.subscribe(params => {
      this.groupId = params.get('groupId')
    })

    this.route.paramMap.subscribe(params => {
      this.channelId = params.get('channelId')
    })

    this.socketService.getMessage((messageData: any) => {
      this.messages.push(messageData)
    })

    this.socketService.getMemberList((data: any) => {
      this.members = data.members
    })

    this.getUsersInChannel();
  }

  getUsersInChannel() {
    if (this.groupId != null && this.channelId != null) {
      this.socketService.reqMemberList(this.groupId!, this.channelId!)
    }
  }

  sendMessage() {
    if (this.curMessage != "") {
      this.socketService.sendMessage(this.groupId!, this.channelId!, this.curMessage)
      this.curMessage = ""
    }
  }
}
