import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SocketService } from '../services/socket.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  groups = null
  activeGroup: string | null = null

  constructor(private router: Router, private route: ActivatedRoute, private socketService: SocketService) {

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
}
