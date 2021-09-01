import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SocketService } from '../services/socket.service';

@Component({
  selector: 'member-list',
  templateUrl: './member-list.component.html',
  styleUrls: ['./member-list.component.css']
})
export class MemberListComponent implements OnInit {
  groupId: string | null = null
  channelId: string | null = null
  members: any[] | null = null

  constructor(private route: ActivatedRoute, private socketService: SocketService) { }

  ngOnInit(): void {
    this.route.parent?.paramMap.subscribe(params => {
      this.groupId = params.get('groupId')
    })

    this.route.paramMap.subscribe(params => {
      this.channelId = params.get('channelId')
    })

    this.socketService.getMemberList((data: any) => {
      this.members = data.members
    })
  }

  getUsersInChannel() {
    if (this.groupId != null && this.channelId != null) {
      this.socketService.reqMemberList(this.groupId!, this.channelId!)
    }
  }

}
