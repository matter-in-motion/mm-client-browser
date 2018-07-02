function getHooks(ctx, name) {
  let hooks = ctx.hooks[name];
  if (!hooks) {
    hooks = ctx.hooks[name] = {
      will: [],
      did: []
    };
  }
  return hooks;
}

export default {
  will: function(name, hook) {
    const hooks = getHooks(this, name);
    hook && hooks.will.push(hook);
    return this;
  },

  did: function(name, hook) {
    const hooks = getHooks(this, name);
    hook && hooks.did.push(hook);
    return this;
  }
}
