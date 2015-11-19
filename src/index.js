import { deprecate } from 'util';
import softdelete from './soft-delete';

export default deprecate(
  app => app.loopback.modelBuilder.mixins.define('SoftDelete', softdelete),
  'DEPRECATED: Use mixinSources, see https://github.com/clarkbw/loopback-ds-timestamp-mixin#mixinsources'
);
