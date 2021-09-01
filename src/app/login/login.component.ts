import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http'

const BACKEND_URL = "http://localhost:3000"
const httpOptions = {
  headers: new HttpHeaders({'Content-Type': 'application/json'})
}

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  email: string = ""
  password: string = ""
  error: string = ""

  constructor(private router: Router, private httpClient: HttpClient) { }

  ngOnInit(): void {
  }

  login(): void {
    if (this.email == "" || this.password == "") {
      this.error = "Please enter a valid email and password"
      return
    }

    var user = {
      "email": this.email,
      "password": this.password
    }

    this.httpClient.post(BACKEND_URL + '/api/auth', user, httpOptions).subscribe((data: any) => {
      if (data.ok) {
        sessionStorage.setItem("user", JSON.stringify(data.user))
        this.router.navigateByUrl('/home');
      } else {
        this.error = "You have entered an invalid email or password"
        this.password = ""
      }
    })
  }
}
