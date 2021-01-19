import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class UserComponent implements OnInit {

  constructor() { }
  showlogin:boolean;
  currentuser:any;
  loginusername:string;
  loginuserpassword:string;
  loginpending:boolean;

  ngOnInit(): void {
  }

  Login(){}
  Logout(){}
}
