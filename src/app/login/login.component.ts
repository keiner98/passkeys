import { Component, OnInit } from '@angular/core';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  formLogin!: FormGroup;
  constructor(private http: HttpClient, private fromBuilder: FormBuilder) {}

  ngOnInit(): void {
    this.formLogin = this.fromBuilder.group({
      username: ['', Validators.required],
      password: '',
    });
  }
  async _fetch(path: string, payload: any = '') {
    let headers = {
      'X-Requested-With': 'XMLHttpRequest',
      'Content-Type': 'application/json',
    };
    if (payload && !(payload instanceof FormData)) {
      payload = JSON.stringify(payload);
    }
    const res = await fetch(path, {
      method: 'POST',
      credentials: 'same-origin',
      headers: headers,
      body: payload,
    });
    if (res.status === 200) {
      // Server authentication succeeded
      return res.json();
    } else {
      // Server authentication failed
      const result = await res.json();
      throw new Error(result.error);
    }
  }

  encode(buffer: any) {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  }

  decode(base64url: any) {
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    console.log(base64url, base64);
    const binStr = atob(base64);
    console.log(base64url, base64);

    const bin = new Uint8Array(binStr.length);
    console.log(base64url, base64);

    for (let i = 0; i < binStr.length; i++) {
      bin[i] = binStr.charCodeAt(i);
    }
    console.log(base64url, base64);

    return bin.buffer;
  }
  async authenticate() {
    // TODO: Add an ability to authenticate with a passkey: Obtain the
    const options = await this._fetch('/auth/signinRequest');

    // TODO: Add an ability to authenticate with a passkey: Locally verify
    // Base64URL decode the challenge.
    options.challenge = this.decode(options.challenge);

    // The empty allowCredentials array invokes an account selector
    options.allowCredentials = [];

    // Invoke the WebAuthn get() function.
    const cred: any = await navigator.credentials.get({
      publicKey: options,

      // Request a conditional UI.
      mediation: 'required',
    });

    // TODO: Add an ability to authenticate with a passkey: Verify the credential.
    const credential: any = {};
    credential.id = cred.id;
    credential.rawId = cred.id; // Pass a this encoded ID string.
    credential.type = cred.type;

    // this encode some values.
    const clientDataJSON = this.encode(cred.response.clientDataJSON);
    const authenticatorData = this.encode(cred.response.authenticatorData);
    const signature = this.encode(cred.response.signature);
    const userHandle = this.encode(cred.response.userHandle);

    credential.response = {
      clientDataJSON,
      authenticatorData,
      signature,
      userHandle,
    };

    return await this._fetch(`/auth/signinResponse`, credential);
  }

  registerPassKey(e: any) {
    console.log('Passkey', e.target.dataset.credId);
  }

  async registerCredential() {
    const options = await this._fetch('/auth/registerRequest');
    options.user.id = this.decode(options.user.id);
    options.challenge = this.decode(options.challenge);
    console.log(options);

    if (options.excludeCredentials) {
      for (let cred of options.excludeCredentials) {
        cred.id = this.decode(cred.id);
      }
    }
    console.log(options);
    // Use platform authenticator and discoverable credential.
    options.authenticatorSelection = {
      authenticatorAttachment: 'platform',
      requireResidentKey: true,
    };
    console.log(options);

    const cred: any = await navigator.credentials.create({
      publicKey: options,
    });

    let credential: any = {};
    credential.id = cred?.id as string;
    credential.rawId = cred?.id; // Pass a Base64URL encoded ID string.
    credential.type = cred?.type;

    // The authenticatorAttachment string in the PublicKeyCredential object is a new addition in WebAuthn L3.
    if (cred?.authenticatorAttachment) {
      credential.authenticatorAttachment = cred.authenticatorAttachment;
    }

    // Base64URL encode some values.
    const clientDataJSON = this.encode(cred.response.clientDataJSON);
    const attestationObject = this.encode(cred.response.attestationObject);

    // Obtain transports.
    const transports = cred.response.getTransports
      ? cred.response.getTransports()
      : [];

    credential.response = {
      clientDataJSON,
      attestationObject,
      transports,
    };

    return await this._fetch('/auth/registerResponse', credential);
  }
  // TODO: Add an ability to create a passkey: Create the registerCredential() function.

  // TODO: Add an ability to authenticate with a passkey: Create the authenticate() function.

  updateCredential(credId: string, newName: string) {
    return this._fetch(`/auth/renameKey`, { credId, newName });
  }

  unregisterCredential(credId: any) {
    return this._fetch(`/auth/removeKey?credId=${encodeURIComponent(credId)}`);
  }

  form() {
    console.log(this.formLogin.value);
    this.http
      .post(
        'https://access-control.mango-api-dev.com/v1/create-credential/manuel.valencia:users/manuel.valencia:current',
        {
          fullName: 'Keiner',
        }
      )
      .subscribe((resp: any) => {
        let options = { ...resp };
        options.challenge = this.decode(options.challenge);
        options.user.id = this.decode(options.user.id);
        if (options.excludeCredentials) {
          for (let cred of options.excludeCredentials) {
            cred.id = this.decode(cred.id);
          }
        }
        console.log(options);
        // Use platform authenticator and discoverable credential.
        options.authenticatorSelection = {
          authenticatorAttachment: 'platform',
          requireResidentKey: true,
        };
        console.log(options);

        const cred: any = navigator.credentials
          .create({
            publicKey: options,
          })
          .then(
            (resp) => {
              console.log(resp);
            },
            (err) => {
              console.log(err);
            }
          );

        let credential: any = {};
        credential.id = cred?.id as string;
        credential.rawId = cred?.id; // Pass a Base64URL encoded ID string.
        credential.type = cred?.type;

        // The authenticatorAttachment string in the PublicKeyCredential object is a new addition in WebAuthn L3.
        if (cred?.authenticatorAttachment) {
          credential.authenticatorAttachment = cred.authenticatorAttachment;
        }

        // Base64URL encode some values.
        const clientDataJSON = this.encode(cred.response.clientDataJSON);
        const attestationObject = this.encode(cred.response.attestationObject);

        // Obtain transports.
        const transports = cred.response.getTransports
          ? cred.response.getTransports()
          : [];

        credential.response = {
          clientDataJSON,
          attestationObject,
          transports,
        };
        console.log(credential);
      });
  }
}
