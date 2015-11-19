import _debug from './debug';
const debug = _debug();

export default (Model, { deletedAt = 'deletedAt', _isDeleted = '_isDeleted', scrub = false }) => {
  debug('SoftDelete mixin for Model %s', Model.modelName);

  debug('options', { deletedAt, _isDeleted, scrub });

  const properties = Model.definition.properties;
  const scrubbed = scrub ?
    Object.keys(properties)
      .filter(prop => !properties[prop].id && prop !== _isDeleted)
      .reduce((obj, prop) => ({ ...obj, [prop]: null }), {})
    : {};

  Model.defineProperty(deletedAt, {type: Date, required: false, default: undefined});
  Model.defineProperty(_isDeleted, {type: Boolean, required: true, default: false});

  Model.destroyAll = function softDestroyAll(where, cb) {
    const defaultScope = Model.defaultScope;
    Model.defaultScope = () => {};

    return Model.updateAll(where, { ...scrubbed, [deletedAt]: new Date(), [_isDeleted]: true }).then(result => {
      Model.defaultScope = defaultScope;
      if (cb) return cb(null, result);
      return Promise.resolve(result);
    }).catch(error => cb(error));
  };

  Model.remove = Model.destroyAll;
  Model.deleteAll = Model.destroyAll;

  Model.destroyById = function softDestroyById(id, cb) {
    const defaultScope = Model.defaultScope;
    Model.defaultScope = () => {};

    return Model.updateAll({ id: id }, { ...scrubbed, [deletedAt]: new Date(), [_isDeleted]: true }).then(result => {
      Model.defaultScope = defaultScope;
      if (cb) return cb(null, result);
      return Promise.resolve(result);
    }).catch(error => cb(error));
  };

  Model.removeById = Model.destroyById;
  Model.deleteById = Model.destroyById;

  Model.prototype.destroy = function softDestroy(cb) {
    const defaultScope = Model.defaultScope;
    Model.defaultScope = () => {};

    return this.updateAttributes({ ...scrubbed, [deletedAt]: new Date(), [_isDeleted]: true }).then(result => {
      Model.defaultScope = defaultScope;
      if (cb) return cb(null, result);
      return Promise.resolve(result);
    }).catch(error => cb(error));
  };

  Model.prototype.remove = Model.prototype.destroy;
  Model.prototype.delete = Model.prototype.destroy;

  // Emulate default scope but with more flexibility.
  const _findOrCreate = Model.findOrCreate;
  Model.findOrCreate = function findOrCreateDeleted(query = {}, ...rest) {
    if (!query.where) query.where = {};

    if (!query.deleted) {
      query.where[_isDeleted] = false;
    }

    return _findOrCreate.call(Model, query, ...rest);
  };

  const _find = Model.find;
  Model.find = function findDeleted(query = {}, ...rest) {
    if (!query.where) query.where = {};

    if (!query.deleted) {
      query.where[_isDeleted] = false;
    }

    return _find.call(Model, query, ...rest);
  };

  const _count = Model.count;
  Model.count = function countDeleted(where = {}, ...rest) {
    // Because count only receives a 'where', there's nowhere to ask for the deleted entities.
    where[_isDeleted] = false;
    return _count.call(Model, where, ...rest);
  };

  const _update = Model.update;
  Model.update = Model.updateAll = function updateDeleted(where = {}, ...rest) {
    // Because update/updateAll only receives a 'where', there's nowhere to ask for the deleted entities.
    where[_isDeleted] = false;
    return _update.call(Model, where, ...rest);
  };
};
