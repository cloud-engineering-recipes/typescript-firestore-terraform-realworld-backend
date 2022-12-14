import 'jest-extended';
import * as request from 'supertest';
import {faker} from '@faker-js/faker';
import {app} from '../../src/app';
import {articlesClient, clearFirestore, jwt, usersClient} from '../utils';

describe('POST /api/articles', () => {
  const createArticleUrl = '/api/articles';

  beforeEach(async () => {
    await clearFirestore();
  });

  describe('given a valid request', () => {
    test('given all fields are set should return http status code 201 and the article', async () => {
      const author = await usersClient.registerRandomUser();

      const requestBody = {
        article: {
          title:
            ' Tired of falling from the sky? This is how to train your dragon!',
          description: faker.lorem.sentences(),
          body: faker.lorem.paragraphs(),
          tagList: [' tag1 ', 'Tag4', ' tag 2 ', 'Tag4', ' a Tag 3 '],
        },
      };

      const response = await request(app)
        .post(createArticleUrl)
        .set('authorization', `Token ${author.user.token}`)
        .send(requestBody);

      expect(response.status).toBe(201);
      expect(response.body).toStrictEqual({
        article: {
          slug: 'tired-of-falling-from-the-sky-this-is-how-to-train-your-dragon!',
          title:
            'Tired of falling from the sky? This is how to train your dragon!',
          description: requestBody.article.description,
          body: requestBody.article.body,
          tagList: ['a-tag-3', 'tag-2', 'tag1', 'tag4'],
          createdAt: expect.toBeDateString(),
          updatedAt: expect.toBeDateString(),
          favorited: false,
          favoritesCount: 0,
          author: {
            username: author.user.username,
            bio: author.user.bio,
            image: author.user.image,
            following: false,
          },
        },
      });
    });

    test('given no tagList should return http status code 201 and the article', async () => {
      const author = await usersClient.registerRandomUser();

      const requestBody = {
        article: {
          title:
            ' Tired of falling from the sky? This is how to train your dragon! ',
          description: faker.lorem.sentences(),
          body: faker.lorem.paragraphs(),
        },
      };

      const response = await request(app)
        .post(createArticleUrl)
        .set('authorization', `Token ${author.user.token}`)
        .send(requestBody);

      expect(response.status).toBe(201);
      expect(response.body).toStrictEqual({
        article: {
          slug: 'tired-of-falling-from-the-sky-this-is-how-to-train-your-dragon!',
          title:
            'Tired of falling from the sky? This is how to train your dragon!',
          description: requestBody.article.description,
          body: requestBody.article.body,
          tagList: [],
          createdAt: expect.toBeDateString(),
          updatedAt: expect.toBeDateString(),
          favorited: false,
          favoritesCount: 0,
          author: {
            username: author.user.username,
            bio: author.user.bio,
            image: author.user.image,
            following: false,
          },
        },
      });
    });
  });

  describe('title validation', () => {
    test('given no title should return http status code 422 and an errors object', async () => {
      const author = await usersClient.registerRandomUser();

      const requestBody = {
        article: {
          description: faker.lorem.sentences(),
          body: faker.lorem.paragraphs(),
          tagList: faker.lorem.words().split(' '),
        },
      };

      const response = await request(app)
        .post(createArticleUrl)
        .set('authorization', `Token ${author.user.token}`)
        .send(requestBody);

      expect(response.status).toBe(422);
      expect(response.body).toStrictEqual({
        errors: {
          body: ['"article.title" is required'],
        },
      });
    });

    test('given title results in taken slug should return http status code 422 and an errors object', async () => {
      const author = await usersClient.registerRandomUser();

      const existingAuthor = await usersClient.registerRandomUser();

      const existingArticle = await articlesClient.createRandomArticle(
        existingAuthor.user.token
      );

      const requestBody = {
        article: {
          title: existingArticle.article.title,
          description: faker.lorem.sentences(),
          body: faker.lorem.paragraphs(),
          tagList: faker.lorem.words().split(' '),
        },
      };

      const response = await request(app)
        .post(createArticleUrl)
        .set('authorization', `Token ${author.user.token}`)
        .send(requestBody);

      expect(response.status).toBe(422);
      expect(response.body).toStrictEqual({
        errors: {
          body: ['"slug" is taken'],
        },
      });
    });
  });

  describe('description validation', () => {
    test('given no description should return http status code 422 and an errors object', async () => {
      const author = await usersClient.registerRandomUser();

      const requestBody = {
        article: {
          title: faker.lorem.sentence(),
          body: faker.lorem.paragraphs(),
          tagList: faker.lorem.words().split(' '),
        },
      };

      const response = await request(app)
        .post(createArticleUrl)
        .set('authorization', `Token ${author.user.token}`)
        .send(requestBody);

      expect(response.status).toBe(422);
      expect(response.body).toStrictEqual({
        errors: {
          body: ['"article.description" is required'],
        },
      });
    });
  });

  describe('body validation', () => {
    test('given no body should return http status code 422 and an errors object', async () => {
      const author = await usersClient.registerRandomUser();

      const requestBody = {
        article: {
          title: faker.lorem.sentence(),
          description: faker.lorem.sentences(),
          tagList: faker.lorem.words().split(' '),
        },
      };

      const response = await request(app)
        .post(createArticleUrl)
        .set('authorization', `Token ${author.user.token}`)
        .send(requestBody);

      expect(response.status).toBe(422);
      expect(response.body).toStrictEqual({
        errors: {
          body: ['"article.body" is required'],
        },
      });
    });
  });

  describe('authentication errors', () => {
    test('given no authentication should return http status code 401 and an errors object', async () => {
      const requestBody = {
        article: {
          title:
            ' Tired of falling from the sky? This is how to train your dragon!',
          description: faker.lorem.sentences(),
          body: faker.lorem.paragraphs(),
        },
      };

      const response = await request(app)
        .post(createArticleUrl)
        .send(requestBody);

      expect(response.status).toBe(401);
      expect(response.body).toStrictEqual({
        errors: {
          body: ['unauthorized'],
        },
      });
    });

    test('given user is not found should return http status code 401 and an errors object', async () => {
      const token = jwt.getRandomToken();

      const requestBody = {
        article: {
          title:
            ' Tired of falling from the sky? This is how to train your dragon!',
          description: faker.lorem.sentences(),
          body: faker.lorem.paragraphs(),
        },
      };

      const response = await request(app)
        .post(createArticleUrl)
        .set('authorization', `Token ${token}`)
        .send(requestBody);

      expect(response.status).toBe(401);
      expect(response.body).toStrictEqual({
        errors: {
          body: ['unauthorized'],
        },
      });
    });

    test('given token has wrong issuer should return http status code 401 and an errors object', async () => {
      const issuer = faker.internet.url();

      const token = jwt.getRandomToken({issuer});

      const requestBody = {
        article: {
          title:
            ' Tired of falling from the sky? This is how to train your dragon!',
          description: faker.lorem.sentences(),
          body: faker.lorem.paragraphs(),
        },
      };

      const response = await request(app)
        .post(createArticleUrl)
        .set('authorization', `Token ${token}`)
        .send(requestBody);

      expect(response.status).toBe(401);
      expect(response.body).toStrictEqual({
        errors: {
          body: ['unauthorized'],
        },
      });
    });

    test('given token is expired should return http status code 401 and an errors object', async () => {
      const user = await usersClient.registerRandomUser();

      const expiresInSeconds = 1;

      const token = jwt.getRandomToken({
        subject: user.user.id,
        expiresInSeconds,
      });

      await new Promise(r => setTimeout(r, expiresInSeconds * 1000 + 1));

      const requestBody = {
        article: {
          title:
            ' Tired of falling from the sky? This is how to train your dragon!',
          description: faker.lorem.sentences(),
          body: faker.lorem.paragraphs(),
        },
      };

      const response = await request(app)
        .post(createArticleUrl)
        .set('authorization', `Token ${token}`)
        .send(requestBody);

      expect(response.status).toBe(401);
      expect(response.body).toStrictEqual({
        errors: {
          body: ['unauthorized'],
        },
      });
    });
  });
});
