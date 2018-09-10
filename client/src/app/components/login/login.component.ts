import { Component, OnInit } from '@angular/core';
// importar modulos del router para poder hacer redirecciones etc
import { Router, ActivatedRoute, Params } from '@angular/router';
import { User } from '../../models/user';
import { UserService } from '../../services/user.service';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  providers: [UserService]
})
export class LoginComponent implements OnInit {
  public title: String;
  public user: User;
  public status: String;
  public identity;
  public token;

  constructor(
    private _route: ActivatedRoute,
    private _router: Router,
    private userService: UserService
  ) {
    this.title = 'Identificate';
    this.user = new User('','','','','','','ROLE_USER','');

  }

  ngOnInit() {
  }

  onSubmit() {

    this.userService.signup(this.user).subscribe(
      response => {
        this.identity = response.user;
        if (!this.identity || !this.identity._id) {
          this.status = 'error';
        } else {
          //this.status = 'success';
          // Persistencia
          localStorage.setItem('identity', JSON.stringify(this.identity));
          //Conseguir token
          this.getToken();
        }

      },
      error => {
        var errorMessage = <any>error;
        console.log(errorMessage);
        if (errorMessage != null) {
          this.status = 'error';
        }
      }
    );
  }

  getToken() {
    this.userService.signup(this.user, 'true').subscribe(
      response => {
        this.token = response.token;

        if (this.token.length <= 0) {
          this.status = 'error';
        } else {
          //this.status = 'success';
          // Persistencia token
          localStorage.setItem('token', JSON.stringify(this.token));
          //conseguir contadores
          this.getCounters();

        }

      },
      error => {
        var errorMessage = <any>error;
        console.log(errorMessage);
        if (errorMessage != null) {
          this.status = 'error';
        }
      }
    );
  }




  getCounters() {
    this.userService.getCounters().subscribe(
      response => {
        if (response) {
          //console.log(response);
          localStorage.setItem('stats', JSON.stringify(response));
          this.status = 'success';
          this._router.navigate(['/']);
        }
      },
      error => {
        console.log('hay error');
        console.log(<any>error);
      }
    );
  }

}
