import { Injectable } from '@angular/core';
import { HttpClient,HttpParams  } from '@angular/common/http';
import { retry } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  constructor(private authservice:AuthService,private http:HttpClient) { }

  public apiurl = this.authservice.APIURL;
  asseturl = this.authservice.ASSETURL;
  websiteurl = this.authservice.WEBSITEURL;
  websitename = this.authservice.WEBSITENAME;

  
  
// User Actions for API here



}
