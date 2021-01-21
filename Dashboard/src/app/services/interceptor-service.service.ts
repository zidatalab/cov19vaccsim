import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class InterceptorService {
  private refreshTokenInProgress = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(
    private router: Router,
    private _auth: AuthService,
    private _api: ApiService
  ) {
  }
  apiurl = this._api.REST_API_SERVER;
  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (request.url.includes(this.apiurl)) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${this._auth.getToken()}`
        }

      });
    }


    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {

        // Refresh if token has expired and Userdetails not null
        if (request.url.includes(this.apiurl) && this._auth.getUserDetails() &&
          error.status == 401 && !this.refreshTokenInProgress) {
          this.refreshTokenInProgress = true;
          this._auth.refreshToken();
        }

        // Logout on Refresh error
        if (request.url.includes(this.apiurl) && error.status == 422) {
          this.refreshTokenInProgress = false;
          this._auth.logout();
          this.router.navigate(["/"]);
        }

        return throwError(error);
      }

      ))
  }
}