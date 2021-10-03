import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserService } from './services/user.service';

const SERVER_URL = 'http://localhost:3000/';

@Injectable({
  providedIn: 'root'
})
export class UploadService {

  constructor(private http: HttpClient, private userService: UserService) { }

  uploadAvatar(fd: FormData) {
    return this.http.post<any>(SERVER_URL + 'api/uploadavatar', fd).toPromise().then((res) => {
      this.userService.imageUrl = SERVER_URL + 'avatar/' + res.data.filename;
    })
  }

  uploadAttachment(fd: FormData) {
    return this.http.post<any>(SERVER_URL + 'api/uploadattachment', fd).toPromise();
  }
}
