// Track allocations inside synchronous Three.js factories, including detached resources.
export function runThreeStartup(three, build) {
  const resources = new Set(),
    nodes = new Set(),
    released = new Set(),
    hooks = [],
    children = [],
    constructors = new Map();
  let pending = true;
  function track(value) {
    if (!pending) return value;
    if (value?.geometry) track(value.geometry);
    if (value?.material)
      for (const material of Array.isArray(value.material)
        ? value.material
        : [value.material])
        track(material);
    if (value && typeof value.dispose === 'function' && !resources.has(value)) {
      resources.add(value);
      const mark = () => released.add(value);
      value.addEventListener?.('dispose', mark);
      hooks.push(() => value.removeEventListener?.('dispose', mark));
      for (const child of Object.values(value))
        if (child?.isTexture) track(child);
    }
    if (value && typeof value.traverse === 'function') nodes.add(value);
    return value;
  }
  const scoped = new Proxy(three, {
    get(target, key) {
      const value = target[key];
      if (typeof value !== 'function' || !/^\p{Lu}/u.test(String(key)))
        return value;
      if (!constructors.has(key))
        constructors.set(
          key,
          new Proxy(value, {
            construct(Type, args) {
              return track(Reflect.construct(Type, args));
            },
          }),
        );
      return constructors.get(key);
    },
  });
  const own = (value, method = 'dispose') => {
    if (pending && value && typeof value[method] === 'function')
      children.push(() => value[method]());
    return value;
  };
  try {
    return build(scoped, own);
  } catch (error) {
    for (const node of [...nodes])
      try {
        node.traverse(track);
      } catch {}
    pending = false;
    const cleanup = (fn) => {
      try {
        const result = fn();
        result?.catch?.((failure) =>
          console.warn('Factory rollback failed', failure),
        );
      } catch (failure) {
        console.warn('Factory rollback failed', failure);
      }
    };
    for (const release of children.reverse()) cleanup(release);
    for (const node of nodes) cleanup(() => node.parent?.remove(node));
    for (const resource of [...resources].reverse())
      if (!released.has(resource))
        cleanup(() => {
          released.add(resource);
          return resource.dispose();
        });
    throw error;
  } finally {
    pending = false;
    for (const remove of hooks)
      try {
        remove();
      } catch {}
    hooks.length = 0;
    released.clear();
    resources.clear();
    nodes.clear();
    children.length = 0;
    constructors.clear();
  }
}
