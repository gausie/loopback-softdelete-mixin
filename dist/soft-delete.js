'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _extends6 = require('babel-runtime/helpers/extends');

var _extends7 = _interopRequireDefault(_extends6);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _debug2 = require('./debug');

var _debug3 = _interopRequireDefault(_debug2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug3.default)();

exports.default = function (Model, _ref) {
  var _ref$deletedAt = _ref.deletedAt;
  var deletedAt = _ref$deletedAt === undefined ? 'deletedAt' : _ref$deletedAt;
  var _ref$_isDeleted = _ref._isDeleted;

  var _isDeleted = _ref$_isDeleted === undefined ? '_isDeleted' : _ref$_isDeleted;

  var _ref$scrub = _ref.scrub;
  var scrub = _ref$scrub === undefined ? false : _ref$scrub;

  debug('SoftDelete mixin for Model %s', Model.modelName);

  debug('options', { deletedAt: deletedAt, _isDeleted: _isDeleted, scrub: scrub });

  var properties = Model.definition.properties;
  var scrubbed = scrub ? (0, _keys2.default)(properties).filter(function (prop) {
    return !properties[prop].id && prop !== _isDeleted;
  }).reduce(function (obj, prop) {
    return (0, _extends7.default)({}, obj, (0, _defineProperty3.default)({}, prop, null));
  }, {}) : {};

  Model.defineProperty(deletedAt, { type: Date, required: false, default: undefined });
  Model.defineProperty(_isDeleted, { type: Boolean, required: true, default: false });

  Model.destroyAll = function softDestroyAll(where, cb) {
    var _extends3;

    var defaultScope = Model.defaultScope;
    Model.defaultScope = function () {};

    return Model.updateAll(where, (0, _extends7.default)({}, scrubbed, (_extends3 = {}, (0, _defineProperty3.default)(_extends3, deletedAt, new Date()), (0, _defineProperty3.default)(_extends3, _isDeleted, true), _extends3))).then(function (result) {
      Model.defaultScope = defaultScope;
      if (cb) return cb(null, result);
      return _promise2.default.resolve(result);
    }).catch(function (error) {
      return cb(error);
    });
  };

  Model.remove = Model.destroyAll;
  Model.deleteAll = Model.destroyAll;

  Model.destroyById = function softDestroyById(id, cb) {
    var _extends4;

    var defaultScope = Model.defaultScope;
    Model.defaultScope = function () {};

    return Model.updateAll({ id: id }, (0, _extends7.default)({}, scrubbed, (_extends4 = {}, (0, _defineProperty3.default)(_extends4, deletedAt, new Date()), (0, _defineProperty3.default)(_extends4, _isDeleted, true), _extends4))).then(function (result) {
      Model.defaultScope = defaultScope;
      if (cb) return cb(null, result);
      return _promise2.default.resolve(result);
    }).catch(function (error) {
      return cb(error);
    });
  };

  Model.removeById = Model.destroyById;
  Model.deleteById = Model.destroyById;

  Model.prototype.destroy = function softDestroy(cb) {
    var _extends5;

    var defaultScope = Model.defaultScope;
    Model.defaultScope = function () {};

    return this.updateAttributes((0, _extends7.default)({}, scrubbed, (_extends5 = {}, (0, _defineProperty3.default)(_extends5, deletedAt, new Date()), (0, _defineProperty3.default)(_extends5, _isDeleted, true), _extends5))).then(function (result) {
      Model.defaultScope = defaultScope;
      if (cb) return cb(null, result);
      return _promise2.default.resolve(result);
    }).catch(function (error) {
      return cb(error);
    });
  };

  Model.prototype.remove = Model.prototype.destroy;
  Model.prototype.delete = Model.prototype.destroy;

  // Emulate default scope but with more flexibility.
  var _findOrCreate = Model.findOrCreate;
  Model.findOrCreate = function findOrCreateDeleted() {
    var query = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    if (!query.where) query.where = {};

    if (!query.deleted) {
      query.where[_isDeleted] = false;
    }

    for (var _len = arguments.length, rest = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      rest[_key - 1] = arguments[_key];
    }

    return _findOrCreate.call.apply(_findOrCreate, [Model, query].concat(rest));
  };

  var _find = Model.find;
  Model.find = function findDeleted() {
    var query = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    if (!query.where) query.where = {};

    if (!query.deleted) {
      query.where[_isDeleted] = false;
    }

    for (var _len2 = arguments.length, rest = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      rest[_key2 - 1] = arguments[_key2];
    }

    return _find.call.apply(_find, [Model, query].concat(rest));
  };

  var _count = Model.count;
  Model.count = function countDeleted() {
    var where = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    // Because count only receives a 'where', there's nowhere to ask for the deleted entities.
    where[_isDeleted] = false;

    for (var _len3 = arguments.length, rest = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
      rest[_key3 - 1] = arguments[_key3];
    }

    return _count.call.apply(_count, [Model, where].concat(rest));
  };

  var _update = Model.update;
  Model.update = Model.updateAll = function updateDeleted() {
    var where = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    // Because update/updateAll only receives a 'where', there's nowhere to ask for the deleted entities.
    where[_isDeleted] = false;

    for (var _len4 = arguments.length, rest = Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
      rest[_key4 - 1] = arguments[_key4];
    }

    return _update.call.apply(_update, [Model, where].concat(rest));
  };
};
//# sourceMappingURL=soft-delete.js.map
