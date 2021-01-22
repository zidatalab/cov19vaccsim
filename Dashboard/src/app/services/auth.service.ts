import { Injectable } from '@angular/core'; 
import { ApiService } from './api.service';
import {HttpParams} from '@angular/common/http';  
import { Router } from '@angular/router'; 
import { BehaviorSubject, Observable, Observer, fromEvent, merge } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ 
    providedIn: 'root' 
}) 
export class AuthService { 
    private currentUserSubject: BehaviorSubject<any>;
    public currentUser: Observable<any>;

    constructor(private _api:ApiService,
        private router:Router) { 
            this.currentUserSubject = new BehaviorSubject<any>(JSON.parse(localStorage.getItem('userInfo')));
            this.currentUser = this.currentUserSubject.asObservable();    
    } 

    OnlineStatus() {
        return merge<boolean>(
          fromEvent(window, 'offline').pipe(map(() => false)),
          fromEvent(window, 'online').pipe(map(() => true)),
          new Observable((sub: Observer<boolean>) => {
            sub.next(navigator.onLine);
            sub.complete();
          }));
      }
    
    login(formdata){ 
        let b = formdata;
        const payload = new HttpParams()
          .set('username', b.username)
          .set('password', b.password)
          .set('client_id', this._api.REST_API_SERVER_CLIENTID);
        return this._api.postTypeRequest('login', payload); 
      }
 
    adduser(data){
        return this._api.postTypeRequest('newuser', data); 
    }
    
    refreshToken(){
        return this._api.getTypeRequest('login/refresh').subscribe(
            data=>{
                let result :any = data;
                this.setDataInLocalStorage('token',result.access_token)
                this.updateUserData();
            }
        )
    }

    storeUserDetails(data) { 
        return localStorage.setItem('userInfo', JSON.stringify({data}));
    } 

    public getUserDetails() { 
        return localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')) : null; 
    } 
     
    setDataInLocalStorage(variableName, data) { 
        localStorage.setItem(variableName, data); 
    } 
 
    public getToken() { 
        return localStorage.getItem('token'); 
    } 
 
    public logout(){
        this.currentUserSubject.next(null);
        localStorage.clear(); 
    } 

    updateUserData(){
        this._api.getTypeRequest('users/me').subscribe(
            data => {
                this.storeUserDetails(data);
                this.currentUserSubject.next(this.getUserDetails());
            },
            error =>
            {
                
            }
        )
    }
    

    public gettokeninfo() {
        let token = this.getToken();
        var base64Url = token.split('.')[1];
        var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    return JSON.parse(jsonPayload);
    };
}
