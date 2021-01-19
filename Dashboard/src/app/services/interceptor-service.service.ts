import { Injectable } from '@angular/core'; 
import { HttpEvent, HttpHandler, HttpRequest } from '@angular/common/http'; 
import { Observable } from 'rxjs'; 
import { Router } from '@angular/router'; 
import { AuthService } from './auth.service'; 
import { ApiService } from './api.service';
 
@Injectable({ 
  providedIn: 'root' 
}) 
export class InterceptorService { 
 
  constructor( 
    private router: Router, 
    private _auth: AuthService ,
    private _api : ApiService
  ) { 
  } 
  apiurl = this._api.REST_API_SERVER;
  intercept( 
    request: HttpRequest<any>, 
    next: HttpHandler 
  ): Observable<HttpEvent<any>> { 
    if (request.url.includes(this.apiurl)){
    console.log("URL",request.url);
    request = request.clone({ 
      setHeaders: { 
        Authorization: `Bearer ${this._auth.getToken()}` 
      } 
    
    });     
  }
 
    return next.handle(request) 
  } 
}