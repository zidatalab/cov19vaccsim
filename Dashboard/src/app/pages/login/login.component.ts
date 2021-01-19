import { Component, OnInit } from '@angular/core'; 
import { FormBuilder, FormGroup, Validators } from '@angular/forms'; 
import { Router } from '@angular/router'; 
import { AuthService } from 'src/app/services/auth.service'; 
import {ApiService} from '../../services/api.service' 
import {HttpParams} from '@angular/common/http';  
 
@Component({ 
  selector: 'app-login', 
  templateUrl: './login.component.html', 
  styleUrls: ['./login.component.scss'] 
}) 
export class LoginComponent implements OnInit { 
  form: FormGroup 
  constructor( 
    private _api : ApiService, 
    private _auth: AuthService, 
    private router: Router, 
    public fb: FormBuilder 
    
  ) { }
  loggedin:boolean; 
 
  ngOnInit(): void { 
    this.form = this.fb.group({ 
      username: ['', Validators.required], 
      password:['', Validators.required] 
    }); 
    if(this._auth.getToken()){this.loggedin=true;}
  } 
 
  login(){ 
    let b = this.form.value 
    const payload = new HttpParams()
      .set('username', b.username)
      .set('password', b.password);
    this._api.postTypeRequest('login', payload).subscribe((res: any) => { 
      console.log(res) 
      if(res.access_token){ 
        this._auth.setDataInLocalStorage('token', res.access_token) 
        this.router.navigate(['profile']) 
      } 
    }, err => { 
      console.log(err) 
    }); 
  }
  
  logout(){
    localStorage.clear();
    this.router.navigate(['']);
  }
 
}
