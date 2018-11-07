# Matter In Motion. Browser client

[![NPM Version](https://img.shields.io/npm/v/mm-client-browser.svg?style=flat-square)](https://www.npmjs.com/package/mm-client-browser)
[![NPM Downloads](https://img.shields.io/npm/dt/mm-client-browser.svg?style=flat-square)](https://www.npmjs.com/package/mm-client-browser)

Browser client for [matter in motion](https://github.com/matter-in-motion/mm) framework

## Installation

`npm i mm-client-browser`

## Usage

```js
import MM from 'mm-client-browser';
import HTTP from 'mm-client-browser/http';

const mm = new MM({
  host: 'localhost:3000',
  tls: false,
  log: (level, ...args) => console.log(level, ...args)
});

mm.addTransport(HTTP());
mm.init(() => {
  console.log('ready');
  // example from post resource
  mm.call('post.get', { })
});

```

### Methods

#### constructor(settings)

Creates the matter-in-motion client. Settings are:

* **host** — string, the host name for the api server.
* tls — boolean, default true. Should client use secure connection.
* serializer — mime string, default 'application/json'. Data type mime that is expected from the server.
* api — string, path, default '/api'. Api path.
* log — function. Function that will be used to log.

#### addTransport(transport)

Adds a transport.

#### setTransport(name)

Sets default transport.

#### setAuth(controller)

Sets the authentication controller.

#### isAuthenticated()

Returns `null` if no authentication controller defined. Othewise calls the `this.auth.isAuthenticated` method and returns the result.

#### init(callback)

Inits all the transports. Initis the authentication controller if present. Calls callback.

#### call(call, body, options, cb)

Calls the api. Similar calls will be throttled.

#### will(call, fn)

Adds will call hook.

#### did(call, fn)

Adds did call hook.

License: MIT

© velocityzen
