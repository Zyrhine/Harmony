import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { SocketService } from '../services/socket.service';

@Component({
  selector: 'group-list',
  templateUrl: './group-list.component.html',
  styleUrls: ['./group-list.component.css']
})
export class GroupListComponent implements OnInit {
  groups = null

  constructor(private socketService: SocketService) { }

  ngOnInit(): void {
    this.socketService.reqGroupList()
    this.socketService.getGroupList((groupList: any) => {
      this.groups = JSON.parse(groupList)
      console.log("Available Groups:")
      console.log(this.groups)
    })
  }

  @Output() navigateToGroupEvent = new EventEmitter<string>();

  navigateToGroup(groupId: string) {
    this.navigateToGroupEvent.emit(groupId)
  }

  groupHub() {

  }
}
