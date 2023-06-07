import { Component, OnInit } from '@angular/core';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  startRegistration,
  startAuthentication,
} from '@simplewebauthn/browser';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  formLogin!: FormGroup;
  credentials: any[] = [];
  constructor(private http: HttpClient, private fromBuilder: FormBuilder) {}

  ngOnInit(): void {
    this.http
      .get(
        'https://access-control.mango-api-dev.com/v1/generate-authentication-options/carlos.orozco:users/carlos.orozco:current'
      )
      .subscribe((resp: any) => {
        this.credentials = resp.data.credentials.allowCredentials;
        const challenge = resp.data.credentials.challenge;
        startAuthentication(resp.data.credentials).then(
          (auth) => {
            this.http
              .post(
                'https://access-control.mango-api-dev.com/v1/verify-authentication/carlos.orozco:users/carlos.orozco:current',
                { auth, challenge }
              )
              .subscribe((resp: any) => {
                console.log(resp);
              });
          },
          (error) => console.log(error)
        );
      });
    this.formLogin = this.fromBuilder.group({
      username: ['', Validators.required],
      password: '',
    });
  }

  encode(buffer: any) {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  }

  decode(base64url: any) {
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    const binStr = atob(base64);
    const bin = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i++) {
      bin[i] = binStr.charCodeAt(i);
    }
    return bin.buffer;
  }

  async authenticate() {}

  form() {
    console.log(this.formLogin.value);
    this.http
      .post(
        'https://access-control.mango-api-dev.com/v1/create-registration/carlos.orozco:users/carlos.orozco:current',
        {
          displayName: 'Cell phone',
        }
      )
      .subscribe((resp: any) => {
        let options = { ...resp.data };
        const challenge = options.challenge;
        // options.challenge = this.decode(options.challenge);
        // options.user.id = this.decode(options.user.id);
        // if (options.excludeCredentials) {

        //   for (let cred of options.excludeCredentials) {
        //     cred.id = this.decode(cred.id);
        //   }

        // }
        // // Use platform authenticator and discoverable credential.
        // options.authenticatorSelection = {
        //   authenticatorAttachment: 'platform',
        //   requireResidentKey: true,
        // };

        // navigator.credentials
        //   .create({
        //     publicKey: options,
        //   })
        //   .then(
        //     (cred: any) => {
        //       let credential: any = {};
        //       credential.id = cred?.id as string;
        //       credential.rawId = cred?.id; // Pass a Base64URL encoded ID string.
        //       credential.type = cred?.type;
        //       // The authenticatorAttachment string in the PublicKeyCredential object is a new addition in WebAuthn L3.
        //       if (cred?.authenticatorAttachment) {
        //         credential.authenticatorAttachment =
        //           cred.authenticatorAttachment;
        //       }
        //       // Base64URL encode some values.
        //       const clientDataJSON = this.encode(cred.response.clientDataJSON);
        //       const attestationObject = this.encode(
        //         cred.response.attestationObject
        //       );

        //       // Obtain transports.
        //       const transports = cred.response.getTransports
        //         ? cred.response.getTransports()
        //         : ['internal', 'hybrid'];

        //       credential.response = {
        //         clientDataJSON,
        //         attestationObject,
        //         transports,
        //       };
        //       console.log(credential);
        //     },
        //     );

        startRegistration(options).then((resp) => {
          console.log(resp);
          this.http
            .post(
              'https://access-control.mango-api-dev.com/v1/verify-registration/carlos.orozco:users/carlos.orozco:current',
              { registration: resp, challenge }
            )
            .subscribe(
              (resp) => {
                console.log(resp);
              },
              (err) => {
                console.log(err);
              }
            );
        });
      });
  }
}
