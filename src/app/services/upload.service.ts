import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserService } from '../services/user.service';

const SERVER_URL = 'http://localhost:3000/';

@Injectable({
  providedIn: 'root'
})
export class UploadService {

  constructor(private http: HttpClient, private userService: UserService) { }

  uploadAvatar(fd: FormData) {
    return this.http.post<any>(SERVER_URL + 'api/uploadavatar', fd).toPromise().then((res) => {
      this.userService.imageUrl = SERVER_URL + 'avatar/' + res.data.filename;

      // Update sessionStorage
      var userString = sessionStorage.getItem("user");
      if (userString != null) {
        var user = JSON.parse(userString);
        user.imageUrl = res.data.filename;
        sessionStorage.setItem('user', JSON.stringify(user));
      }
    })
  }

  uploadAttachment(fd: FormData) {
    return this.http.post<any>(SERVER_URL + 'api/uploadattachment', fd).toPromise();
  }
}
