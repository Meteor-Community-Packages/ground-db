import ServerTime from './servertime';

Ground = {};

Ground.Collection = class GroundCollection {
  constructor(/* name, options = {} */) {
    throw new Error('Ground.Collection is client-side only');
  }
};

export default { Ground };
