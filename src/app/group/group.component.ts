import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SocketService } from '../services/socket.service';

@Component({
  selector: 'group',
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.css']
})
export class GroupComponent implements OnInit {
  groupId: string | null = null
  group: Group | null = null
  isInRoom: boolean = false

  constructor(private router: Router, private route: ActivatedRoute, private socketService: SocketService) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.groupId = params.get('groupId')
      this.reloadGroup()
    })

    this.socketService.getGroupInfo((groupInfo: any) => {
      this.group = new Group(groupInfo._id, groupInfo.name, groupInfo.channels)
      this.socketService.joinGroupRoom(this.group._id)
    })

    this.socketService.joined((msg: string) => {
      this.isInRoom = true
    })
  }

  reloadGroup(): void {
    if (this.groupId != null) {
      this.socketService.reqGroupInfo(this.groupId)
    }
  }

  navigateToChannel(channelId: string) {
    console.log("Navigated to " + channelId)
    this.router.navigate(['./channel', channelId ], { relativeTo: this.route });
  }
}

class Group {
  _id: string
  name: string
  channels: Object[]

  constructor(_id: string, name: string, channels: Object[]) {
    this._id = _id
    this.name = name
    this.channels = channels
  }
}
