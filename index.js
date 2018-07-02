import compose from 'uc-compose';
import { LOG_LEVEL } from 'uc-log';

import hooks from './hooks';

const requests = {};

const MM = function(settings) {
  this.hooks = {};
  this.transports = {};
  this.settings = Object.assign({
    api: '/api',
    tls: true,
    serializer: 'application/json'
  }, settings);
  this.log = settings.log;

  if (this.settings.host) {
    this.host = (this.settings.tls ? 'https://' : 'http://') + this.settings.host;
  }
};

MM.prototype = compose(
  hooks,
  {
    addTransport: function(transport) {
      this.transports[transport.name] = transport;
      this.setTransport(transport.name);
      return this;
    },

    setTransport: function(name) {
      this.transport = this.transports[name];
      return this;
    },

    setAuth: function(controller) {
      this.auth = controller;
      return this;
    },

    app: function(app) {
      this._app = app;
    },

    init: function(cb) {
      if (this.host) {
        this
          .initTransports()
          .initAuth(() => {
            this.log && this.log(LOG_LEVEL.INFO, 'ready',
              `tls:${(this.settings.tls === undefined ? false : this.settings.tls)}`,
              `transport: ${this.transport.name}`,
              `api: ${this.settings.api}`);

            cb && cb();
          });
      } else {
        cb && cb();
      }

      return this;
    },

    initTransports: function() {
      for (const name in this.transports) {
        this.transports[name].init(this, this.settings);
      }

      return this;
    },

    initAuth: function(cb) {
      if (!this.auth) {
        this.log && this.log(LOG_LEVEL.WARNING, 'warning', 'no auth controller defined');
        cb && cb();
        return;
      }

      this.auth.init(cb);
    },

    getMeta: function() {
      return this.auth ? this.auth.meta() : undefined;
    },

    // throttles all calls
    call: function(call, body, opts, cb) {
      if (typeof opts === 'function') {
        cb = opts;
        opts = {};
      } else if (!opts) {
        opts = {};
      }

      const hash = JSON.stringify({ call: call, body: body });

      this.log(LOG_LEVEL.INFO, 'call queued', call, body);

      if (requests[hash]) {
        requests[hash].cbs.push(cb);
        return;
      }

      requests[hash] = {
        call: call,
        body: body,
        opts: opts,
        cbs: [ cb ]
      };

      setTimeout(() => {
        this._call(call, body, opts, (err, res) => {
          requests[hash].cbs.forEach(cb => cb.call(this, err, res));
          delete requests[hash];
        });
      }, 0);
    },

    //main call function, transport agnostic,
    //returns connection object with abort method
    _call: function(call, body, opts, cb) {
      if (typeof opts === 'function') {
        cb = opts;
        opts = {};
      } else if (!opts) {
        opts = {};
      }

      //use only http for files upload
      const transport = opts.files || opts.url ? this.transports.http : this.transport;
      this.log(LOG_LEVEL.INFO, `${transport.name} call`, call, body);

      const hooks = this.hooks[call];
      if (hooks && hooks.will) {
        const res = hooks.will.reduce((a, b) => b.call(this, a), body);

        if (res !== body) {
          return this.didCall(hooks, res, cb);
        }
      }

      return transport.send({
        url: opts.url,
        call: call,
        meta: this.getMeta(),
        body: body,
        files: opts.files,
        progress: opts.progress
      }, msg => {
        if (typeof msg[0] === 'object') {
          this.log(LOG_LEVEL.ERROR, call, body, msg[0]);
          cb && cb(msg[0]);
          return;
        }
        this.log(LOG_LEVEL.INFO, `${transport.name} response`, call, msg[1]);
        this.didCall(hooks, msg[1], cb);
      });
    },

    didCall: function(hooks, res, cb) {
      if (hooks && hooks.did) {
        res = hooks.did.reduce((a, b) => b.call(this, a), res);
      }
      cb && cb(null, res);
    }
  }
);

export default MM;
