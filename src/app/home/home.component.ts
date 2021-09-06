import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SocketService } from '../services/socket.service';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  groups = null
  activeGroup: string | null = null

  constructor(private router: Router, private route: ActivatedRoute, private socketService: SocketService, public userService: UserService) {

  }

  ngOnInit(): void {
    this.socketService.initSocket();
    this.socketService.reqGroupList();
    this.socketService.getGroupList((groupList: any) => {
      this.groups = groupList;
      this.router.navigate(['./' ], { relativeTo: this.route });
    })
  }

  navigateToGroup(groupId: string) {
    console.log("Navigated to " + groupId)
    this.activeGroup = groupId;
    this.router.navigate(['./group' , groupId ], { relativeTo: this.route });
  }

  groupHub() {
    this.router.navigate(['./group-index' ], { relativeTo: this.route });
  }

  controlPanel() {
    this.router.navigate(['./control-panel' ], { relativeTo: this.route });
  }

  logout() {
    sessionStorage.clear();
    this.router.navigate(['../login' ], { relativeTo: this.route });
    this.socketService.disconnect();
  }
}
