import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SocketService } from '../services/socket.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  constructor(private router: Router, private route: ActivatedRoute, private socketService: SocketService) {

  }

  ngOnInit() {
    this.socketService.initSocket()
  }

  navigateToGroup(groupId: string) {
    console.log("Navigated to " + groupId)
    this.router.navigate(['./group' , groupId ], { relativeTo: this.route });
  }
}
