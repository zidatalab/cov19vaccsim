// https://raw.githubusercontent.com/bartosz-io/jwt-auth-angular/master/src/app/auth/token.interceptor.ts
// Needs tuning
import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpInterceptor , HttpEvent , HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Observable , BehaviorSubject, throwError} from 'rxjs';
import { catchError  } from 'rxjs/operators';
import { Router } from '@angular/router';


// import { Observable } from 'rxjs';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
    private refreshTokenInProgress = false;
    // Refresh Token Subject tracks the current token, or is null if no token is currently
    // available (e.g. refresh pending).
    private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(public authService: AuthService, public router: Router) { }

  // All HTTP requests are going to go through this method
  intercept(req: HttpRequest<any>, next: HttpHandler):   Observable<HttpEvent<any>> {
    
    // Apply Header Modification and proceed
    return next.handle(this.addAuthenticationToken(req)).pipe(
        catchError((error : HttpErrorResponse) => {
            
          if (error.status == 422) {
            this.authService.logout().subscribe();
            this.router.navigate(["/"]);
            return throwError(error);
        }
        
          if (error.status !== 401) {
                return throwError(error);
          }
          
          if (req.url.includes("/auth/refresh")) {
            this.authService.logout().subscribe();
            this.router.navigate(["/"]); ;            
            return throwError(error);
          }          
            

          if (req.url.includes("api") && (error.status==401) && (this.refreshTokenInProgress==false)) {
            this.refreshTokenInProgress = true;  
              this.authService.refreshToken().subscribe(
                data => {this.refreshTokenInProgress = false},
                error => {
                  this.refreshTokenInProgress = false;
                  this.router.navigate(["/"]);                       
                }
              );
                return throwError(error);
          }

            return throwError(error);

           
            })
        );

      
}

  private addToken(headers, token, csrftoken) {
    headers = headers.set('authorization', `Bearer ${token}`);
    headers = headers.set('X-CSRF-TOKEN', `${csrftoken}` );
    return headers;
  }

  private addAuthenticationToken(request) {
    // Collect Request Headers
    let modHeaders  = request.headers;

    // Add token to header if approriate url
    if (this.authService.isLoggedIn() && (request.url.indexOf('/auth/refresh') === -1)) {
        modHeaders = this.addToken(modHeaders, this.authService.getJwtToken(), this.authService.getCSRFToken());
      }
    
    // return modified request
    return request.clone({headers: modHeaders});

}

}