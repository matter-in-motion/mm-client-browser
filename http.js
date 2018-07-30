import Request from 'uc-request';

const Http = function(settings) {
  // no settings yet
};

Http.prototype = {
  name: 'http',

  init: function(mm, opts) {
    this.host = mm.host;
    this.mime = opts.serializer;
    this.api = this.host + opts.api;
  },

  send: function(req, cb) {
    const r = {
      headers: {
        'MM': JSON.stringify({ call: req.call })
      },
      url: req.url || this.api,
      method: req.method || 'POST'
    }

    if (req.meta) {
      r.headers.Authorization = 'Bearer ' + req.meta;
    }

    if (req.files) {
      const formData = new FormData();
      for (const field in req.body) {
        formData.append(field, req.body[field]);
      }

      const files = req.files;
      for (let i = 0, l = files.length; i < l; i++) {
        formData.append(i, files[i]);
      }
      r.body = formData;
    } else {
      r.headers['Content-Type'] = this.mime;
      r.headers['Accept'] = this.mime;
      r.body = req.body ? JSON.stringify(req.body) : '';
    }

    r.onprogress = req.progress;
    return Request.send(r, result => {
      if (result.status >= 200 && result.status < 300) {
        cb(result.body);
      } else {
        const err = new Error();
        err.code = 5000;
        err.message = 'Server error';
        err.data = result;
        cb([ err ]);
      }
    });
  }
};

export default settings => new Http(settings);
