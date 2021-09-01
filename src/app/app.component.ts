import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Harmony';

  constructor(private router: Router) {

  }

  ngOnInit() {
    var user = sessionStorage.getItem("user")
    if (user) {
      this.router.navigateByUrl('/home')
    } else {
      this.router.navigateByUrl('/login')
    }
  }
}
