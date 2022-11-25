import * as request from 'supertest';
import * as assert from 'node:assert';
import {faker} from '@faker-js/faker';
import {app} from '../../src/app';

class ArticlesClient {
  constructor() {}

  async createRandomArticle(token: string) {
    const randomSuffix = faker.random.alphaNumeric(8);

    const requestBody = {
      article: {
        title: `${faker.lorem.sentence()}-${randomSuffix}`,
        description: faker.lorem.sentences(),
        body: faker.lorem.paragraphs(),
        tagList: faker.lorem.words().split(' '),
      },
    };

    const response = await request(app)
      .post('/articles')
      .set('authorization', `Token ${token}`)
      .send(requestBody);

    assert.strictEqual(response.statusCode, 201);

    return response.body;
  }

  async favoriteArticle(token: string, articleSlug: string) {
    const response = await request(app)
      .post(`/articles/${articleSlug}/favorite`)
      .set('authorization', `Token ${token}`)
      .send();

    assert.strictEqual(response.statusCode, 200);

    return response.body;
  }

  async addRandomComment(token: string, articleSlug: string) {
    const requestBody = {
      comment: {
        body: faker.lorem.paragraphs(),
      },
    };

    const response = await request(app)
      .post(`/articles/${articleSlug}/comments`)
      .set('authorization', `Token ${token}`)
      .send(requestBody);

    assert.strictEqual(response.statusCode, 201);

    return response.body;
  }

  async getCommentsFromArticle(articleSlug: string, token?: string) {
    let req = request(app).get(`/articles/${articleSlug}/comments`);

    if (token) {
      req = req.set('authorization', `Token ${token}`);
    }

    const response = await req.send();

    assert.strictEqual(response.statusCode, 200);

    return response.body;
  }
}

const articlesClient = new ArticlesClient();

export {articlesClient};
