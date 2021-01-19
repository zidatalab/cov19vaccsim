import { Component, OnInit } from '@angular/core';
import { from } from 'rxjs';
import {AuthService} from '../../service/auth.service';
import {AppService} from '../../service/app.service';
@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class UserComponent implements OnInit {

  constructor(private auth:AuthService, private service:AppService) { }
  showlogin:boolean;
  currentuser:any;
  loginusername:string;
  loginuserpassword:string;
  loginpending:boolean;

  ngOnInit(): void {
  }

  Login(){
    this.service.login(this.loginusername,this.loginuserpassword)
    .subscribe(data => {console.log(data);this.currentuser=data;},error => {console.log(error)});

  }
  Logout(){}
}
