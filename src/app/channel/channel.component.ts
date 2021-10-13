import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { SocketService } from '../services/socket.service';
import { UserService } from '../services/user.service';
import { UploadService } from '../services/upload.service';

@Component({
  selector: 'channel',
  templateUrl: './channel.component.html',
  styleUrls: ['./channel.component.css']
})
export class ChannelComponent implements OnInit {
  channel: any | null = null
  members: any | null = null
  onlineMembers: any | null = []
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

  constructor(private socketService: SocketService, private route: ActivatedRoute, private uploadService: UploadService, private userService: UserService) { }

  ngOnInit(): void {
    this.channelInfoSub = this.socketService.onChannelInfo().subscribe((channelInfo: any) => {
      console.log("Got channel info.");
      this.channel = channelInfo;
    })

    this.memberListSub = this.socketService.onChannelMemberList().subscribe((memberList: any) => {
      console.log("Got member list.");
      this.members = memberList.members;

      // Populate onlineMembers 
      this.onlineMembers = [];
      memberList.onlineIds.forEach((id: any) => {
        var user = this.getUserData(id);
        if (user) {
          this.onlineMembers.push(user);
        } else {
          user = {
            name: 'Unknown User',
            imageUrl: "default.png"
          }
          this.onlineMembers.push(user);
        }
      })

      // Populate message history with new user data
      this.messages.forEach((message: any) => {
        // Get the user from the member list
        var user = this.getUserData(message.userId);

        // Add user and image URL onto it
        if (user) {
          message.imageUrl = user.imageUrl;
          message.name = user.name;
        } else {
          message.imageUrl = "default.png";
          message.name = "[Removed User]";
        }
      });
    })

    this.channelHistorySub = this.socketService.onChannelHistory().subscribe((channelHistory: any) => {
      console.log("Got history.");
      this.messages = channelHistory;
    })

    this.messageSub = this.socketService.onMessage().subscribe((messageData: any) => {
      console.log("Got message.")
      // Get the user from the member list
      var user = this.getUserData(messageData.userId);

      // Add user and image URL onto it
      if (user) {
        messageData.imageUrl = user.imageUrl;
        messageData.name = user.name;
      } else {
        messageData.imageUrl = "default.png";
        messageData.name = "[Unknown User]";
      }
      
      this.messages.push(messageData);
    })

    this.parentRouteSub = this.route.parent?.params.subscribe(params => {
      this.groupId = params.groupId;
    })

    this.routeSub = this.route.params.subscribe(params => {
      this.channelId = params.channelId;
      this.socketService.joinChannel(this.channelId!);
    })

    this.joinedChannelSub = this.socketService.onJoinedChannel().subscribe((channelId: string) => {
      console.log("Joined channel.")
      this.socketService.channelId = channelId;
      console.log("Socket Service: " + this.socketService.channelId)
      this.socketService.reqChannelInfo(this.channelId!);
      this.socketService.reqChannelMemberList(this.channelId!);
      this.socketService.reqChannelHistory(this.groupId!, this.channelId!);
      this.isReady = true;
    })
  }

  getUserData(userId: string) {
    return this.members.find((user: any) => user._id == userId);
  }

  sendMessage() {
    if (this.selectedFile != null) {
      const fd = new FormData();
      fd.append('image', this.selectedFile!, this.selectedFile!.name);
      fd.append('userId', this.userService.id!);
      this.uploadService.uploadAttachment(fd).then((res: any) => {
        this.socketService.sendMessage(this.groupId!, this.channelId!, this.curMessage, [res.data.filename]);
        this.selectedFile = null;
        this.curMessage = "";
      })
    }

    if (this.curMessage != "") {
      this.socketService.sendMessage(this.groupId!, this.channelId!, this.curMessage, []);
      this.curMessage = "";
    }
  }

  selectedFile: any = null;

  onFileSelected(e: any) {
    this.selectedFile = e.target.files[0];
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
