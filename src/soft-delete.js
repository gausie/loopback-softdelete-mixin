import _debug from './debug';
const debug = _debug();

export default (Model, { deletedAt = 'deletedAt', _isDeleted = '_isDeleted', scrub = false }) => {
  debug('SoftDelete mixin for Model %s', Model.modelName);

  debug('options', { deletedAt, _isDeleted, scrub });

  const properties = Model.definition.properties;

  let scrubbed = {};
  if (scrub !== false) {
    let propertiesToScrub = scrub;
    if (!Array.isArray(propertiesToScrub)) {
      propertiesToScrub = Object.keys(properties)
        .filter(prop => !properties[prop].id && prop !== _isDeleted);
    }
    scrubbed = propertiesToScrub.reduce((obj, prop) => ({ ...obj, [prop]: null }), {});
  }

  Model.defineProperty(deletedAt, {type: Date, required: false});
  Model.defineProperty(_isDeleted, {type: Boolean, required: true, default: false});

  Model.destroyAll = function softDestroyAll(where, cb) {
    return Model.updateAll(where, { ...scrubbed, [deletedAt]: new Date(), [_isDeleted]: true })
      .then(result => (typeof cb === 'function') ? cb(null, result) : result)
      .catch(error => (typeof cb === 'function') ? cb(error) : Promise.reject(error));
  };

  Model.remove = Model.destroyAll;
  Model.deleteAll = Model.destroyAll;

  Model.destroyById = function softDestroyById(id, cb) {
    return Model.updateAll({ id: id }, { ...scrubbed, [deletedAt]: new Date(), [_isDeleted]: true })
      .then(result => (typeof cb === 'function') ? cb(null, result) : result)
      .catch(error => (typeof cb === 'function') ? cb(error) : Promise.reject(error));
  };

  Model.removeById = Model.destroyById;
  Model.deleteById = Model.destroyById;

  Model.prototype.destroy = function softDestroy(options, cb) {
    const callback = (cb === undefined && typeof options === 'function') ? options : cb;

    return this.updateAttributes({ ...scrubbed, [deletedAt]: new Date(), [_isDeleted]: true })
      .then(result => (typeof cb === 'function') ? callback(null, result) : result)
      .catch(error => (typeof cb === 'function') ? callback(error) : Promise.reject(error));
  };

  Model.prototype.remove = Model.prototype.destroy;
  Model.prototype.delete = Model.prototype.destroy;

  // Emulate default scope but with more flexibility.
  const queryNonDeleted = {_isDeleted: false};

  const _findOrCreate = Model.findOrCreate;
  Model.findOrCreate = function findOrCreateDeleted(query = {}, ...rest) {
    if (!query.deleted) {
      if (!query.where) {
        query.where = queryNonDeleted;
      } else {
        query.where = { and: [ query.where, queryNonDeleted ] };
      }
    }

    return _findOrCreate.call(Model, query, ...rest);
  };

  const _find = Model.find;
  Model.find = function findDeleted(query = {}, ...rest) {
    if (!query.deleted) {
      if (!query.where) {
        query.where = queryNonDeleted;
      } else {
        query.where = { and: [ query.where, queryNonDeleted ] };
      }
    }

    return _find.call(Model, query, ...rest);
  };

  const _count = Model.count;
  Model.count = function countDeleted(where = {}, ...rest) {
    // Because count only receives a 'where', there's nowhere to ask for the deleted entities.
    const whereNotDeleted = { and: [ where, queryNonDeleted ] };
    return _count.call(Model, whereNotDeleted, ...rest);
  };

  const _update = Model.update;
  Model.update = Model.updateAll = function updateDeleted(where = {}, ...rest) {
    // Because update/updateAll only receives a 'where', there's nowhere to ask for the deleted entities.
    const whereNotDeleted = { and: [ where, queryNonDeleted ] };
    return _update.call(Model, whereNotDeleted, ...rest);
  };
};
