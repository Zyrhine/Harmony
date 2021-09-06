import { Component, OnInit, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SocketService } from '../services/socket.service';

@Component({
  selector: 'app-control-panel',
  templateUrl: './control-panel.component.html',
  styleUrls: ['./control-panel.component.css']
})
export class ControlPanelComponent implements OnInit {
  @ViewChild('newUserModal') newUserModal: any;
  @ViewChild('editUserModal') editUserModal: any;

  users: any[] = []
  userModel: any = null
  nameInput: string = ""
  passwordInput: string = ""
  emailInput: string = ""

  constructor(private socketService: SocketService, private modalService: NgbModal) { }

  ngOnInit(): void {
    this.socketService.getUserList((userList: any) => {
      this.users = userList
    })

    this.socketService.reqUserList()
  }

  open(content: any) {
    this.modalService.open(content);
  }

  openNewUserModal() {
    this.userModel = {
      name: "",
      password: "",
      email: ""
    }

    this.open(this.newUserModal)
  }

  openEditUserModal(userId: string) {
    // Get the user
    var user = this.users.find((user) => user._id == userId)

    this.userModel = {
      _id: user._id,
      name: user.name,
      password: user.password,
      email: user.email
    }

    this.open(this.editUserModal)
  }

  createUser() {
    this.socketService.createUser(this.userModel)
  }

  updateUser() {
    this.socketService.updateUser(this.userModel)
  }

  deleteUser(userId: string) {
    this.socketService.deleteUser(userId)
  }

  promoteUser(userId: string) {
    this.socketService.promoteUser(userId)
  }
}
