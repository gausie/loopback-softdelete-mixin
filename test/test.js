/* eslint-env mocha */
import { assert } from 'chai';
import loopback from 'loopback';

const app = loopback;
app.loopback = loopback;

import mixin from '../src';

mixin(app);

const dataSource = app.createDataSource({ connector: app.Memory });

// The reason we use order: [] is to avoid strongloop/loopback#1525.
// This is only a problem for memory connectors.
const includeDeleted = { deleted: true, order: [] };

describe('Loopback softDelete mixin', () => {
  describe('Querying', () => {
    it('excludes deleted instances by default during queries', () => {
      const Book = dataSource.createModel('querying_1',
        { id: { type: Number, generated: false, id: true }, name: String, type: String },
        { mixins: { SoftDelete: true } }
      );

      const booksCreated = [
        Book.create({ id: 1, name: 'book 1', type: 'fiction'}),
        Book.create({ id: 2, name: 'book 2', type: 'fiction'}),
        Book.create({ id: 3, name: 'book 3', type: 'non-fiction'}),
      ];

      return Promise.all(booksCreated)
        .then(() => Book.destroyAll({ type: 'non-fiction' }))
        .then(() => Book.find())
        .then(books => {
          assert.lengthOf(books, 2);
          assert.equal(books[0].id, 1);
          assert.equal(books[1].id, 2);
        });
    });

    it('includes deleted instances by configuration during queries', () => {
      const Book = dataSource.createModel('querying_2',
        { id: { type: Number, generated: false, id: true }, name: String, type: String },
        { mixins: { SoftDelete: true } }
      );

      const booksCreated = [
        Book.create({ id: 1, name: 'book 1', type: 'fiction'}),
        Book.create({ id: 2, name: 'book 2', type: 'fiction'}),
        Book.create({ id: 3, name: 'book 3', type: 'non-fiction'}),
      ];

      return Promise.all(booksCreated)
        .then(() => Book.destroyAll({ type: 'non-fiction' }))
        .then(() => Book.find(includeDeleted))
        .then(books => {
          assert.lengthOf(books, 3);

          const deletedBook = books[2];
          assert.equal(deletedBook.id, 3);
          assert.isDefined(deletedBook.deletedAt);
        });
    });
  });

  describe('destroyAll', () => {
    it('should add a deletedAt property to all matching', () => {
      const Book = dataSource.createModel('destroyAll_1',
        { name: String, type: String },
        { mixins: { SoftDelete: true } }
      );

      const booksCreated = [
        Book.create({ name: 'book 1', type: 'fiction'}),
        Book.create({ name: 'book 2', type: 'fiction'}),
        Book.create({ name: 'book 3', type: 'non-fiction'}),
      ];

      return Promise.all(booksCreated)
        .then(() => Book.destroyAll({ type: 'fiction' }))
        .then(() => Book.find(includeDeleted))
        .then(([book1, book2, book3]) => {
          assert.isDefined(book1.deletedAt);
          assert.isDefined(book2.deletedAt);
          assert.isUndefined(book3.deletedAt);
        });
    });

    it('should add a differently named property if configured', () => {
      const Book = dataSource.createModel('destroyAll_2',
        { name: String, type: String },
        { mixins: { SoftDelete: { deletedAt: 'deletedOn' } } }
      );

      const booksCreated = [
        Book.create({ name: 'book 1', type: 'fiction'}),
        Book.create({ name: 'book 2', type: 'fiction'}),
        Book.create({ name: 'book 3', type: 'non-fiction'}),
      ];

      return Promise.all(booksCreated)
        .then(() => Book.destroyAll({ type: 'fiction' }))
        .then(() => Book.find(includeDeleted))
        .then(([book1, book2, book3]) => {
          assert.isDefined(book1.deletedOn);
          assert.isUndefined(book1.deletedAt);

          assert.isDefined(book2.deletedOn);
          assert.isUndefined(book2.deletedAt);

          assert.isUndefined(book3.deletedOn);
        });
    });

    it('should scrub all the non-key fields if configured', () => {
      const Book = dataSource.createModel('destroyAll_3',
        { name: String, type: String },
        { mixins: { SoftDelete: { scrub: true } } }
      );

      const booksCreated = [
        Book.create({ name: 'book 1', type: 'fiction'}),
        Book.create({ name: 'book 2', type: 'fiction'}),
        Book.create({ name: 'book 3', type: 'non-fiction'}),
      ];

      return Promise.all(booksCreated)
        .then(() => Book.destroyAll({ type: 'fiction' }))
        .then(() => Book.find(includeDeleted))
        .then(([book1, book2, book3]) => {
          assert.isNotNull(book1.id);
          assert.isNotNull(book1.deletedAt);
          assert.isNull(book1.name);
          assert.isNull(book1.type);

          assert.isNotNull(book2.id);
          assert.isNotNull(book2.deletedAt);
          assert.isNull(book2.name);
          assert.isNull(book2.type);

          assert.isUndefined(book3.deletedAt);
        });
    });
  });

  describe('destroyById', () => {
    it('should add a deletedAt property to the appropriate instance', () => {
      const Book = dataSource.createModel('destroyById_1',
        { id: {type: Number, generated: false, id: true}, name: String, type: String },
        { mixins: { SoftDelete: true } }
      );

      const booksCreated = [
        Book.create({ id: 1, name: 'book 1', type: 'fiction'}),
        Book.create({ id: 2, name: 'book 2', type: 'fiction'}),
        Book.create({ id: 3, name: 'book 3', type: 'non-fiction'}),
      ];

      return Promise.all(booksCreated)
        .then(() => Book.destroyById(1))
        .then(() => Book.find(includeDeleted))
        .then(([book1, book2, book3]) => {
          assert.isDefined(book1.deletedAt);

          assert.isUndefined(book2.deletedAt);
          assert.isUndefined(book3.deletedAt);
        });
    });

    it('should add a differently named property if configured', () => {
      const Book = dataSource.createModel('destroyById_2',
        { id: {type: Number, generated: false, id: true}, name: String, type: String },
        { mixins: { SoftDelete: { deletedAt: 'deletedOn' } } }
      );

      const booksCreated = [
        Book.create({ id: 1, name: 'book 1', type: 'fiction'}),
        Book.create({ id: 2, name: 'book 2', type: 'fiction'}),
        Book.create({ id: 3, name: 'book 3', type: 'non-fiction'}),
      ];

      return Promise.all(booksCreated)
        .then(() => Book.destroyById(1))
        .then(() => Book.find(includeDeleted))
        .then(([book1, book2, book3]) => {
          assert.isDefined(book1.deletedOn);
          assert.isUndefined(book1.deletedAt);

          assert.isUndefined(book2.deletedAt);
          assert.isUndefined(book2.deletedOn);
          assert.isUndefined(book3.deletedAt);
          assert.isUndefined(book3.deletedOn);
        });
    });

    it('should scrub all the non-key fields if configured', () => {
      const Book = dataSource.createModel('destroyById_3',
        { id: {type: Number, generated: false, id: true}, name: String, type: String },
        { mixins: { SoftDelete: { scrub: true } } }
      );

      const booksCreated = [
        Book.create({ id: 1, name: 'book 1', type: 'fiction'}),
        Book.create({ id: 2, name: 'book 2', type: 'fiction'}),
        Book.create({ id: 3, name: 'book 3', type: 'non-fiction'}),
      ];

      return Promise.all(booksCreated)
        .then(() => Book.destroyById(2))
        .then(() => Book.find(includeDeleted))
        .then(([book1, book2, book3]) => {
          assert.isUndefined(book1.deletedAt);
          assert.isNotNull(book1.name);
          assert.isNotNull(book1.type);

          assert.isNotNull(book2.id);
          assert.isNotNull(book2.deletedAt);

          assert.isNull(book2.name);
          assert.isNull(book2.type);

          assert.isUndefined(book3.deletedAt);
          assert.isNotNull(book3.name);
          assert.isNotNull(book3.type);
        });
    });
  });

  describe('destroy', () => {
    it('should add a deletedAt property to the instance', () => {
      const Book = dataSource.createModel('destroy_1',
        { id: {type: Number, generated: false, id: true}, name: String, type: String },
        { mixins: { SoftDelete: true } }
      );

      return Book.create({ id: 1, name: 'book 1', type: 'fiction'})
        .then(book => book.destroy())
        .then(book => {
          assert.isDefined(book);
          assert.isDefined(book.deletedAt);
        });
    });

    it('should add a differently named property if configured', () => {
      const Book = dataSource.createModel('destroy_2',
        { id: {type: Number, generated: false, id: true}, name: String, type: String },
        { mixins: { SoftDelete: { deletedAt: 'deletedOn' } } }
      );

      return Book.create({ id: 1, name: 'book 1', type: 'fiction'})
        .then(book => book.destroy())
        .then(book => {
          assert.isDefined(book);
          assert.isDefined(book.deletedOn);
        });
    });

    it('should scrub all the non-key fields if configured', () => {
      const Book = dataSource.createModel('destroy_3',
        { id: {type: Number, generated: false, id: true}, name: String, type: String },
        { mixins: { SoftDelete: { scrub: true } } }
      );

      return Book.create({ id: 1, name: 'book 1', type: 'fiction'})
        .then(book => book.destroy())
        .then(book => {
          assert.equal(book.id, 1);
          assert.isNull(book.name);
          assert.isNull(book.type);
          assert.isNotNull(book.deletedAt);
          assert.isDefined(book.deletedAt);
        });
    });
  });
});
