import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';
import {GLOBAL} from './global';
import {User} from '../models/user';

// Con el decorador Injectable le indicamos que esta clase
// la vamos apoder inyectar como servicio en cualquier componente
@Injectable()
export class UserService {
    public url: String;
    public identity;
    public token;
    public stats;

    constructor(
        public _http: HttpClient
    ) {
        this.url = GLOBAL.url;
    }

    // Le indico que me va a devolver un Observable de tipo any (recomendable)
    register(user: User): Observable<any> {
        // Convierto los datos en un json string
        let params = JSON.stringify(user);
        // El backend lo podra interpretar como un objeto json
        let headers = new HttpHeaders().set('Content-Type', 'application/json');

        return this._http.post(this.url + 'register', params, {headers: headers});

    }

    // user podria ser un objeto del tipo User, pero al agregar la propiedad .gettoken
    // que no tenemos en el modelo da un error. Podemos o bien definir gettoken en el modelo
    // o cambiar el tipo de parametro en la funcion de User a any.
    signup(user: any, gettoken = null): Observable<any> {
        if (gettoken != null) {
            user.gettoken = gettoken;
        }
        // Convierto los datos en un json string
        let params = JSON.stringify(user);
        // El backend lo podra interpretar como un objeto json
        let headers = new HttpHeaders().set('Content-Type', 'application/json');

        return this._http.post(this.url + 'login', params, {headers: headers});
    }


    getIdentity() {
        let identity = JSON.parse(localStorage.getItem('identity'));

        if (identity !== 'undefined') {
            this.identity = identity;
        } else {
            this.identity = null;
        }
        return this.identity;
    }

    getToken() {
        let token = JSON.parse(localStorage.getItem('token'));
        //let token = localStorage.getItem('token');
        if (token !== 'undefined') {
            this.token = token;
        } else {
            this.token = null;
        }
        return this.token;
    }

    getStats() {
        let stats = JSON.parse(localStorage.getItem('stats'));
        if (stats !== 'undefined') {
            this.stats = stats;
        } else {
            this.stats = null;
        }
        return this.stats;
    }

    getCounters(userId = null): Observable<any> {
        let headers = new HttpHeaders().set('Content-Type', 'application/json')
                                       .set('autorization', this.getToken());
        console.log(':: ' + this.getToken());
        if (userId != null) {
            return this._http.get(this.url + 'counters/' + userId, {headers: headers});
        } else {
            return this._http.get(this.url + 'counters', {headers: headers});
        }
    }



}

