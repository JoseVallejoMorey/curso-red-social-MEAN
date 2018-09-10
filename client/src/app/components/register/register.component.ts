import { Component, OnInit } from '@angular/core';
// importar modulos del router para poder hacer redirecciones etc
import { Router, ActivatedRoute, Params } from '@angular/router';
import { User } from '../../models/user';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  providers: [UserService]
})
export class RegisterComponent implements OnInit {
  public title: String;
  public user: User;
  public status: String;

    // Configurar propiedades del router para tenerlas en la clase
  constructor(
    private _route: ActivatedRoute,
    private _router: Router,
    private _userService: UserService
  ) {
    this.title = 'Registrate';
    this.user = new User('','','','','','','ROLE_USER','');
  }

  ngOnInit() {
  }


  onSubmit(form) {
    // Como este metodo devuelve un Observable me puedo subscribir a el
    this._userService.register(this.user).subscribe(
      response => {
        if (response.user && response.user._id) {
          console.log(response.user);
          this.status = 'success';
          form.reset();
        } else {
          this.status = 'error';
        }
      },
      error => {
        console.log(<any>error);
      }
    );
  }
}
