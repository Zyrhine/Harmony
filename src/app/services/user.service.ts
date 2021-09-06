import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  valid: boolean = false
  id: string | null = null
  email: string | null = null
  name: string | null = null
  role: number | null = null

  constructor() {
    this.login()
  }

  login() {
    var userString = sessionStorage.getItem("user")
    if (userString != null) {
      var user = JSON.parse(userString)
      this.id = user._id
      this.email = user.email
      this.name = user.name
      this.role = user.role
      this.valid = true
    }
  }

  logout() {
    sessionStorage.clear()
    this.id = null
    this.email = null
    this.name = null
    this.role = null
    this.valid = false
  }
}
