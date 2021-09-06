import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
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

  // Subscriptions
  joinedChannelSub: Subscription | null = null
  channelInfoSub: Subscription | null = null
  memberListSub: Subscription | null = null
  channelHistorySub: Subscription | null = null
  messageSub: Subscription | null = null
  parentRouteSub: Subscription | null | undefined = null
  routeSub: Subscription | null | undefined = null

  constructor(private socketService: SocketService, private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.channelInfoSub = this.socketService.onChannelInfo().subscribe((channelInfo: any) => {
      console.log("Got channel info.")
      this.channel = channelInfo
    })

    this.memberListSub = this.socketService.onMemberList().subscribe((memberList: string[]) => {
      console.log("Got member list.")
      this.members = memberList
    })

    this.channelHistorySub = this.socketService.onChannelHistory().subscribe((channelHistory: string[]) => {
      console.log("Got history.")
      this.messages = channelHistory
    })

    this.messageSub = this.socketService.onMessage().subscribe((messageData: any) => {
      console.log("Got message.")
      this.messages.push(messageData)
    })

    this.parentRouteSub = this.route.parent?.params.subscribe(params => {
      this.groupId = params.groupId
    })

    this.routeSub = this.route.params.subscribe(params => {
      this.channelId = params.channelId
      this.socketService.joinChannel(this.channelId!)
    })

    this.joinedChannelSub = this.socketService.onJoinedChannel().subscribe(() => {
      console.log("Joined channel.")
      this.socketService.reqChannelInfo(this.channelId!)
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

  ngOnDestroy() {
    this.channelInfoSub?.unsubscribe();
    this.joinedChannelSub?.unsubscribe();
    this.memberListSub?.unsubscribe();
    this.channelHistorySub?.unsubscribe();
    this.messageSub?.unsubscribe();
    this.parentRouteSub?.unsubscribe();
    this.routeSub?.unsubscribe();
  }
}
