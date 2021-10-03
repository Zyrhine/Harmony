import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SocketService } from '../services/socket.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UserService } from '../services/user.service';
import { Subscription } from 'rxjs';
import { UploadService } from '../upload.service';

@Component({
  selector: 'group',
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.css']
})
export class GroupComponent implements OnInit, OnDestroy {
  @ViewChild('editChannelModal') editChannelModal: any;
  @ViewChild('editGroupModal') editGroupModal: any;
  groupId: string | null = null;
  group: Group | null = null;
  isInRoom: boolean = false;
  channels: any[] | null = null;
  activeChannelId: string | null = null;

  channelNameInput: string = "";
  channelModel: any = null;
  groupModel: any = null;

  groupMembers: any = null;
  groupAssistants: any = null;

  channelMembers: any = null;
  availableChannelMembers: any = null;

  // Subscriptions
  channelListSub: Subscription | null = null
  groupInfoSub: Subscription | null = null
  joinedGroupSub: Subscription | null = null
  routeSub: Subscription | null = null
  groupMembersSub: Subscription | null = null
  channelMembersSub: Subscription | null = null

  canEditChannel: boolean = false
  canEditGroup: boolean = false

  constructor(private router: Router, private route: ActivatedRoute, private socketService: SocketService, private modalService: NgbModal, public userService: UserService, public uploadService: UploadService) { }

  ngOnInit(): void {
    this.groupMembersSub = this.socketService.onGroupMembers().subscribe((memberList: any) => {
      console.log("Got group members")
      this.groupMembers = memberList.members;
      this.groupAssistants = memberList.assistants;

      if (this.userService.role! < 2) {
        // Allow Super Admin and Group Admin
        this.canEditChannel = true;
        this.canEditGroup = true;
      } else {
        console.log("Checking is assistant")
        // Allow Group Assistant
        var isAssistant = this.groupAssistants.find((user: any) => user._id == this.userService.id)
        if (isAssistant) {
          this.canEditChannel = true;
        }
      }
    })

    this.channelMembersSub = this.socketService.onChannelMembers().subscribe((memberList: any) => {
      this.channelMembers = memberList;

      // Find group members not in channel members
      var membersNotInChannel = Array.from(this.groupMembers);
      this.channelMembers.forEach((member: any) => {
        var index = membersNotInChannel.findIndex((otherMember: any) => otherMember._id == member._id)
        if (index) {
          membersNotInChannel.splice(index, 1)
        }
      });

      this.availableChannelMembers = membersNotInChannel
    })

    this.channelListSub = this.socketService.onChannelList().subscribe((channelList: any) => {
      console.log("Got tha channel list.")
      this.channels = channelList;
      this.router.navigate(['./'], { relativeTo: this.route });
    })

    this.groupInfoSub = this.socketService.onGroupInfo().subscribe((groupInfo: any) => {
      this.group = new Group(groupInfo._id, groupInfo.name, groupInfo.members);
    })

    this.joinedGroupSub = this.socketService.onJoinedGroup().subscribe(() => {
      console.log("Joined group.")
      this.socketService.reqGroupInfo(this.groupId!);
      this.socketService.reqChannelList(this.groupId!);
      this.socketService.reqGroupMembers(this.groupId!);
    });

    this.routeSub = this.route.params.subscribe(params => {
      this.groupId = params.groupId;

      if (this.groupId != null) {
        this.socketService.joinGroup(this.groupId);
      }
    })
  }

  navigateToChannel(channelId: string) {
    console.log("Navigated to channel: " + channelId)
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
      members: this.group!.members
    };

    this.socketService.reqGroupMembers(this.group!._id);
    
    this.open(this.editGroupModal);
  }

  saveGroup() {
    this.socketService.updateGroup(this.groupModel);
  }

  deleteGroup() {
    this.socketService.deleteGroup(this.groupId!);
  }

  addGroupMember(email: string) {
    this.socketService.addGroupMember(this.groupId!, email);
  }

  removeGroupMember(userId: string) {
    this.socketService.removeGroupMember(this.groupId!, userId);
  }

  addGroupAssistant(userId: string) {
    console.log(userId)
    this.socketService.addGroupAssistant(this.groupId!, userId);
  }

  removeGroupAssistant(userId: string) {
    this.socketService.removeGroupAssistant(this.groupId!, userId);
  }

  // Channel Management
  createChannel() {
    if (this.channelNameInput != "") {
      this.socketService.createChannel(this.groupId!, this.channelNameInput);
    }
  }

  updateChannel(channelId: string) {
    // Find the channel being editted and get its info
    var channel = this.channels!.find((channel) => channel._id == channelId);

    if (channel) {
      this.channelModel = {
        _id: channel._id,
        groupId: channel.groupId,
        name: channel.name,
        roles: channel.roles
      };

      this.socketService.reqChannelMembers(this.channelModel._id)
      
      this.open(this.editChannelModal);
    }
  }

  addChannelMember(userId: string) {
    this.socketService.addChannelMember(this.groupId!, this.channelModel!._id, userId);
  }

  removeChannelMember(userId: string) {
    this.socketService.removeChannelMember(this.groupId!, this.channelModel!._id, userId);
  }

  saveChannel() {
    this.socketService.updateChannel(this.channelModel);
  }

  deleteChannel() {
    this.socketService.deleteChannel(this.channelModel.groupId, this.channelModel._id);
  }

  selectedFile: any = null;

  onFileSelected(e: any) {
    this.selectedFile = e.target.files[0];
  }

  uploadAvatar() {
    const fd = new FormData();
    fd.append('image', this.selectedFile!, this.selectedFile!.name);
    fd.append('userId', this.userService.id!)
    this.uploadService.uploadAvatar(fd).then((res: any) => {
      console.log("Done upload");
    })
  }


  ngOnDestroy() {
    this.channelListSub?.unsubscribe();
    this.groupInfoSub?.unsubscribe();
    this.joinedGroupSub?.unsubscribe();
    this.routeSub?.unsubscribe();
    this.groupMembersSub?.unsubscribe();
    this.channelMembersSub?.unsubscribe();
  }
}

class Group {
  _id: string
  name: string
  members: object[]

  constructor(_id: string, name: string, members: object[]) {
    this._id = _id
    this.name = name
    this.members = members
  }
}
