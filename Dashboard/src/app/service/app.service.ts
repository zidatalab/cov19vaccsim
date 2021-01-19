import { Injectable } from '@angular/core';
import { HttpClient,HttpParams,HttpHeaders  } from '@angular/common/http';
import { retry } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  constructor(private authservice:AuthService,private http:HttpClient) { }

  apiurl = this.authservice.APIURL;
  asseturl = this.authservice.ASSETURL;
  websiteurl = this.authservice.WEBSITEURL;
  websitename = this.authservice.WEBSITENAME;

  
  
// User Actions for API here

login(username,password){
  let request = { username: username, password: password };
  return this.http.post<any>(`${this.apiurl}/login`,
   request, {
    headers: new HttpHeaders()
      .set('Content-Type', 'application/x-www-form-urlencoded')
  } );
}

}
