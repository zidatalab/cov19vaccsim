import { Component , OnInit} from '@angular/core';
import { ApiService } from './services/api.service';
import { AuthService } from './services/auth.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'COVID-19 Impfkampagne';
  public currentuser : any;
  loginoption = false;
  public loginstatus:boolean;
  today:any; 
  constructor(
    private _auth : AuthService,
    private _api : ApiService    
  ) { }

  ngOnInit() {
    this.today = new Date();
    if (!this.loginoption){
      localStorage.clear();
    }
    this._auth.currentUser.subscribe(data => {
      if (data){
        this.loginstatus = true;
        this.currentuser = data.data;
        
      }
      else {
        this.loginstatus = false;
        this.currentuser = data;
      }
      
      
      },
      error => {
        this.loginstatus = false;
      })

  }


  logout(){
    this._auth.logout();
  }

}
