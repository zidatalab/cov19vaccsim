import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, Observer, fromEvent, merge } from 'rxjs';
import { map } from 'rxjs/operators';


export class User {
  username: string;
  usergroup: string;
  userroles: any= [];
}

@Injectable({
  providedIn: 'root'
})


export class AuthService {
  public PRODAPIURL = "URLMISSING"; 
  public TESTAPIURL ="http://127.0.0.1:8000";
  public APIURL = this.TESTAPIURL;
  ASSETURL = "https://ziwebstorage.blob.core.windows.net/appradar";
  WEBSITEURL = "TESTURL";
  public WEBSITENAME = "Test Dashboard";

  private currentUserSubject: BehaviorSubject<User>;
  public currentUser: Observable<User>;

  constructor(
    private http: HttpClient) {
    this.currentUserSubject = new BehaviorSubject<User>(JSON.parse(localStorage.getItem('currentUser')));
    this.currentUser = this.currentUserSubject.asObservable();
  }



  public get currentUserValue(): User {
    return this.currentUserSubject.value;
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

  login(username: string, password: string) {
    let request = { username: username, password: password, client_id: this.WEBSITENAME };
    return this.http.post<any>(`${this.APIURL}/login`, request)
      .pipe(map(user => {
        // login successful if there's a jwt token in the response
        if (user && user.username && user.usergroup) {
          // store user details and jwt token in local storage to keep user logged in between page refreshes
          localStorage.setItem('currentUser', JSON.stringify({ username: user.username, usergroup: user.usergroup, anrede: user.anrede, nachname: user.nachname , userroles: user.rollen }));
          localStorage.setItem('username', user.username);
          localStorage.setItem('userid', user.id);
          localStorage.setItem('roles', JSON.stringify(user.rollen));
          this.storeTokens(user, false);
          localStorage.setItem('anrede', user.anrede + " " + user.nachname)
          localStorage.setItem('usergroup', user.usergroup)
          localStorage.setItem('refreshes', "1");
          this.currentUserSubject.next(user);
        }

        return user;
      }));

  }

  logout() {
    let headers = new HttpHeaders().set('Content-Type', 'application/json')
      .set('authorization', 'Bearer ' + this.getJwtToken())
      .set('X-CSRF-TOKEN', this.getCSRFToken());
    // remove user from local storage to log user out
    this.removeTokens();
    this.currentUserSubject.next(null);
    return this.http.post<any>(`${this.APIURL}/auth/logout`, {}, { headers: headers });
  }

  
  register(user: JSON) {
    return this.http.post<any>(`${this.APIURL}/auth/register`, user);
  }

  deleteuser(user: JSON){
    return this.http.post<any>(`${this.APIURL}/api/delete_user`, user);
  }

  confirmtoken(thetoken: string) {
    let theheaders = new HttpHeaders().set('Content-Type', 'application/json')
    let therequest = { token: thetoken, secret: "+?zt?iAbuJk!" };
    return this.http.post<any>(`${this.APIURL}/confirm`, therequest, { headers: theheaders });
  }

  resetuserpwd(user: JSON){
    return this.http.post<any>(`${this.APIURL}/auth/forgot_password_mail`, user);
  }



  isLoggedIn() {
    return !!this.getJwtToken();
  }

  refreshToken() {
    let headers = new HttpHeaders().set('Content-Type', 'application/json')
      .set('authorization', 'Bearer ' + this.getRefreshToken())
      .set('X-CSRF-TOKEN', this.getCSRFRefreshToken());
    return this.http.post<any>(`${this.APIURL}/auth/refresh`, {}, { headers: headers })
      .pipe(map(tokens => {
        this.storeTokens(tokens, true);
        let refreshes = 1
        if (localStorage.getItem('refreshes')){
          refreshes = Number(localStorage.getItem('refreshes'))+refreshes;
        } 
        localStorage.setItem('refreshes', refreshes.toString());
      }));
  }

  newrefreshToken() {
    let headers = new HttpHeaders().set('X-CSRF-TOKEN', this.getCSRFRefreshToken());
    return this.http.get<any>(`${this.APIURL}/auth/new_refresh_token`,  { headers: headers })
      .pipe(map(tokens => {
        this.storenewfreshTokens(tokens);
      }));
  }

  phonecall(token){
  return this.http.get<any>(`${this.APIURL}/auth/phone_call?token=${token}`)
  }



  getJwtToken() {
    return localStorage.getItem("access_token");
  }

  getuserid() {
    return localStorage.getItem("userid");
  }

  getCSRFToken() {
    return localStorage.getItem("access_csrf");
  }


  private getRefreshToken() {
    return localStorage.getItem("refresh_token");
  }

 

  private getCSRFRefreshToken() {
    return localStorage.getItem("refresh_csrf");
  }


  private storeTokens(tokens: any, refresh: boolean) {
    if (refresh == false) {
      localStorage.setItem('access_token', tokens.access_token)
      localStorage.setItem('refresh_token', tokens.refresh_token)
      localStorage.setItem('access_csrf', tokens.access_csrf)
      localStorage.setItem('refresh_csrf', tokens.refresh_csrf)
    }
    if (refresh == true) {
      localStorage.setItem('access_token', tokens.access_token)
      localStorage.setItem('access_csrf', tokens.access_csrf)
    }

  }

  private storenewfreshTokens(tokens: any) {
      localStorage.setItem('refresh_token', tokens.refresh_token)
      localStorage.setItem('refresh_csrf', tokens.refresh_csrf)
  }

  private removeTokens() {
    localStorage.clear();
  }

}
