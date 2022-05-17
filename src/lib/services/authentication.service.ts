import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {NavigationService} from './navigation.service';
import {environment} from '../../environments/environment';
import {UserInfo} from '../domain/userInfo';
import {deleteCookie, getCookie} from '../domain/utils';
import {isNullOrUndefined} from '../shared/tools';


@Injectable()
export class AuthenticationService {
  private apiUrl: string = environment.API_ENDPOINT;
  private loginUrl = environment.API_ENDPOINT + '/openid_connect_login';
  private logoutUrl = environment.API_ENDPOINT + '/openid_logout';
  // store the URL so we can redirect after logging in
  public redirectURL: string;
  loggedIn = false;
  cookieName = 'AccessToken';

  user: UserInfo = new UserInfo();

  constructor(public navigationService: NavigationService, public http: HttpClient) {
    // this.tryLogin();
  }

  getUserProperty(property: string) {
    if (isNullOrUndefined(this.user)) {
      this.user = JSON.parse(sessionStorage.getItem('userInfo'));
    }
    if (!isNullOrUndefined(this.user) && !isNullOrUndefined(this.user[property]) && (this.user[property] !== 'null')) {
      return this.user[property];
    }
    return null;
  }

  public login() {
    // console.log(`logging in with state. Current url is: ${this.navigationService.router.url}`);
    if (this.redirectURL) {
      const url = this.redirectURL;
      this.redirectURL = null;
      console.log('stored location', url);
      sessionStorage.setItem('state.location', url);
    } else {
      sessionStorage.setItem('state.location', this.navigationService.router.url);
    }
    // console.log('redirect location', sessionStorage.getItem('state.location'));
    window.location.href = this.loginUrl;
  }

  public tryLogin() {
    // console.log(getCookie(this.cookieName));
    if (getCookie(this.cookieName) !== null) {
      // console.log(`session.name wasn't found --> logging in via repo-service!`);
      this.http.get<UserInfo>(this.apiUrl + '/user/info', { withCredentials: true }).subscribe(
        userInfo => {
          // console.log(userInfo);
          sessionStorage.setItem('firstName', userInfo.firstName);
          sessionStorage.setItem('lastName', userInfo.lastName);
          sessionStorage.setItem('fullName', userInfo.fullName);
          sessionStorage.setItem('email', userInfo.email.trim());
          sessionStorage.setItem('role', userInfo.roles.toString());
          sessionStorage.setItem('sub', userInfo.sub);
        },
        error => {
          deleteCookie(this.cookieName);
          // if (error.status === 403) {
          //   this.login();
          // }
          sessionStorage.clear();
          console.log(error);
          this.loggedIn = false;
        },
        () => {
          this.loggedIn = true;
          if (this.redirectURL) {
            const url = this.redirectURL;
            this.redirectURL = null;
            this.navigationService.router.navigate([url]).then(
              success => {}
            );
          }
        }
      );
    }
  }

  public logout() {
    sessionStorage.clear();
    deleteCookie(this.cookieName);
    this.loggedIn = false;
    // console.log('logging out, calling:');
    // console.log(this.logoutUrl);
    window.location.href = this.logoutUrl;
  }

  public isLoggedIn(): boolean {
    return getCookie(this.cookieName) !== null;
  }

  public getUserName() {
    if (this.loggedIn) {
      return sessionStorage.getItem('name');
    } else {
      return '';
    }
  }

  public getUserEmail() {
    if (this.loggedIn) {
      return sessionStorage.getItem('email');
    } else {
      return '';
    }
  }

  isProvider() {
    if (this.loggedIn) {
      return sessionStorage.getItem('role').includes('ROLE_PROVIDER');
    } else {
      return false;
    }
  }

  isAdmin() {
    if (this.loggedIn) {
      return sessionStorage.getItem('role').includes('ROLE_ADMIN');
    } else {
      return false;
    }
  }

}
