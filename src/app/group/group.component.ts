import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SocketService } from '../services/socket.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'group',
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.css']
})
export class GroupComponent implements OnInit {
  @ViewChild('editChannelModal') editChannelModal: any;
  @ViewChild('editGroupModal') editGroupModal: any;
  groupId: string | null = null
  group: Group | null = null
  isInRoom: boolean = false
  channels: any[] | null = null
  activeChannelId: string | null = null

  channelNameInput: string = ""
  channelModel: any = null
  groupModel: any = null;

  constructor(private router: Router, private route: ActivatedRoute, private socketService: SocketService, private modalService: NgbModal) { }

  ngOnInit(): void {
    this.socketService.getChannelList((channelList: any) => {
      this.channels = channelList
      this.router.navigate(['./'], { relativeTo: this.route });
    })

    this.route.params.subscribe(params => {
      this.groupId = params.groupId

      if (this.groupId != null) {
        this.socketService.reqGroupInfo(this.groupId)
        this.socketService.joinGroup(this.groupId)
        this.socketService.reqChannelList(this.groupId!)
      }
    })

    this.socketService.getGroupInfo((groupInfo: any) => {
      this.group = new Group(groupInfo._id, groupInfo.name, groupInfo.members, groupInfo.roles)
    })

    this.socketService.joinedGroup(() => {

    })
  }

  navigateToChannel(channelId: string) {
    console.log("Navigated to " + channelId)
    this.activeChannelId = channelId;
    this.router.navigate(['./channel', channelId ], { relativeTo: this.route });
  }

  open(content: any) {
    this.modalService.open(content);
  }

  // Group Management
  updateGroup() {
    this.groupModel = {
      _id: this.group!._id,
      name: this.group!.name,
      members: this.group!.members,
      roles: this.group!.roles
    }

    console.log(this.groupModel)
    
    this.open(this.editGroupModal)
  }

  saveGroup() {
    this.socketService.updateGroup(this.groupModel)
  }

  deleteGroup() {
    this.socketService.deleteGroup(this.groupId!)
  }

  // Channel Management
  createChannel() {
    if (this.channelNameInput != "") {
      this.socketService.createChannel(this.groupId!, this.channelNameInput)
    }
  }

  updateChannel(channelId: string) {
    // Find the channel being editted and get its info
    var channel = this.channels!.find((channel) => channel._id == channelId)

    if (channel) {
      this.channelModel = {
        _id: channel._id,
        groupId: channel.groupId,
        name: channel.name,
        roles: channel.roles
      }
      
      this.open(this.editChannelModal)
    }
  }

  deleteChannel() {
    this.socketService.deleteChannel(this.channelModel.groupId, this.channelModel._id)
  }

  saveChannel() {
    this.socketService.updateChannel(this.channelModel)
  }
}

class Group {
  _id: string
  name: string
  members: object[]
  roles: object[]

  constructor(_id: string, name: string, members: object[], roles: object[]) {
    this._id = _id
    this.name = name
    this.members = members
    this.roles = roles
  }
}
