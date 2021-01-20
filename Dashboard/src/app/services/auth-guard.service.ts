import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, Route } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
@Injectable({
  providedIn: 'root'
})
export class AuthGuardService {
constructor(
    private _authService: AuthService,
    private _router: Router
  ) { }



  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    let result = false;
    if (this._authService.getUserDetails()) {
      result = true;
    }
    else {
      this._router.navigate(['/']);
    }
    return result;
  }
}