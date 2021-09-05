import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SocketService } from '../services/socket.service';

@Component({
  selector: 'group-index',
  templateUrl: './group-index.component.html',
  styleUrls: ['./group-index.component.css']
})
export class GroupIndexComponent implements OnInit {
  groupNameInput: string = ""
  groups: any[] | null = null

  constructor(private socketService: SocketService, private modalService: NgbModal) { }

  ngOnInit(): void {
    this.socketService.getGroupIndex((groupList: any) => {
      this.groups = groupList
    })

    this.socketService.reqGroupIndex()
  }

  open(content: any) {
    this.modalService.open(content);
  }

  createGroup() {
    if (this.groupNameInput != "") {
      this.socketService.createGroup(this.groupNameInput)
    }
  }

  joinGroup(groupId: string) {

  }
}
