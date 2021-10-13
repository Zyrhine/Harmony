import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { SocketService } from '../services/socket.service';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  @ViewChild('addGroupModal') addGroupModal: any;
  groups: any[] = []
  activeGroup: string | null = null

  groupListSub: Subscription | null = null

  constructor(private router: Router, private route: ActivatedRoute, private socketService: SocketService, private modalService: NgbModal, public userService: UserService) {

  }

  ngOnInit(): void {
    this.socketService.initSocket();
    this.socketService.reqGroupList();
    this.groupListSub = this.socketService.onGroupList().subscribe((groupList: any) => {

      groupList.forEach((group: any) => {
        group.name = group.name.split(' ').map((i: any) => i.charAt(0)).join('').toUpperCase()
      })

      this.groups = groupList;

      this.router.navigate(['./' ], { relativeTo: this.route });
    })
  }

  navigateToGroup(groupId: string) {
    console.log("Navigated to group: " + groupId)
    this.activeGroup = groupId;
    this.router.navigate(['./group' , groupId ], { relativeTo: this.route });
  }

  openAddGroupModal() {
    this.modalService.open(this.addGroupModal);
  }

  createGroup(groupName: string) {
    if (groupName != "") {
      this.socketService.createGroup(groupName)
    }
  }

  controlPanel() {
    this.router.navigate(['./control-panel' ], { relativeTo: this.route });
  }

  logout() {
    sessionStorage.clear();
    this.router.navigate(['../login' ], { relativeTo: this.route });
    this.socketService.disconnect();
  }

  ngOnDestroy() {
    this.groupListSub?.unsubscribe();
  }
}
