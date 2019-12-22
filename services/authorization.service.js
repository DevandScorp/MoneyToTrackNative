/* eslint-disable no-return-await */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-throw-literal */
/* eslint-disable object-curly-newline */
/* eslint-disable camelcase */
const jwt = require('jsonwebtoken');
const moment = require('moment');
const fs = require('fs-extra');
const path = require('path');
const AuthorizationUtils = require('../utils/authorization.utils');

/**
 * Сервис авторизации
 */
class AuthorizationService {
  constructor({ DatabaseRepository }) {
    this.pool = DatabaseRepository.pool;
  }

  /**
   * Регистрация нового пользователя
   * @param {object} data - объект данных для регистрации
   * @param {string} data.username - имя пользователя
   * @param {string} data.password - пароль
   * @param {object} data.image - файл аватарки пользователя
   * @returns {Promise<Object>}
   */
  async signUp({ username, password, image }) {
    if (!username || !password) throw 'Отсутствуют необходимые данные или были переданы пустые поля';
    if (!/([/|.|\w|\s|-])*\.(?:jpg|gif|png)/.test(image.name)) throw 'Некорректное расширение файла';
    const client = await this.pool.connect();
    try {
      await client.query('begin');
      const imageName = `${username}_logo${path.extname(image.name)}`;
      const imagePath = path.join(__dirname, '../images', imageName);

      await client.query('insert into users(username, password, image) values($1,$2,$3)',
        [username, AuthorizationUtils.encrypt(password), `/images/${imageName}`]);
      await new Promise((resolve, reject) => {
        fs.createReadStream(image.path)
          .pipe(fs.createWriteStream(imagePath))
          .on('error', (err) => {
            client.query('rollback').then(() => reject(err));
          })
          .on('finish', () => resolve());
      });
      await client.query('commit');
    } catch (err) {
      await client.query('rollback');
      throw err;
    }
    return { message: 'OK' };
  }

  /**
   * Логин пользователя, установка токена обновления, выдача токена для авторизации
   * @param {object} data - объект данных для логина пользователя
   * @param {string} data.username - имя пользователя
   * @param {string} data.password - пароль
   */
  async login({ username, password }) {
    if (!username || !password) throw 'Отсутствуют необходимые данные или были переданы пустые поля';
    const [user] = (await this.pool.query(
      'select * from users where username=$1', [username],
    )).rows;
    if (!user) throw { message: 'Пользователь не найден', statusCode: 404 };
    if (password !== AuthorizationUtils.decrypt(user.password)) throw { message: 'Неверный пароль' };
    const token = jwt.sign({ user_id: user.id }, process.env.SECRET_KEY, { expiresIn: 18000 });
    const [result] = (await this.pool.query(`insert into refresh_tokens (user_id, expiration_time)
                          values ($1, $2)
                          on conflict (user_id)
                          do update set refresh_token = default, expiration_time=excluded.expiration_time
                          returning *;
    `, [user.id, moment().add(8, 'hours').toDate()])).rows;
    return {
      user_id: user.id,
      username: user.username,
      user_image: user.image,
      token,
      refresh_token: result.refresh_token,
    };
  }

  /**
   * Обновление токена авторизации
   * @param {object} data - объект данных для обновления токена авторизации
   * @param {object} data.user_id - идентификатор пользователя
   * @param {object} data.refresh_token - токен обновления
   */
  async refreshToken({ user_id, refresh_token }) {
    if (!user_id || !refresh_token) throw 'Отсутствуют необходимые данные или были переданы пустые поля';
    const [usersRefreshToken] = (await this.pool.query(
      'select * from refresh_tokens where user_id=$1', [user_id],
    )).rows;
    if (!usersRefreshToken) throw { statusCode: 404, message: 'Токен отсутствует' };
    if (usersRefreshToken.refresh_token !== refresh_token) throw 'Токены не совпадают';
    if (moment().isAfter(usersRefreshToken.expiration_time)) throw 'Время жизни токена истекло';
    return {
      token: jwt.sign({ user_id }, process.env.SECRET_KEY, { expiresIn: 18000 }),
    };
  }

  /**
   * Удаление токена обновления
   * @param {object} data - объект данных для удаления токена обновления
   * @param {string} data.refresh_token - токен обновления
   * @param {string} data.user_id - идентификатор пользователя
   */
  async rejectToken({ refresh_token, user_id }) {
    if (!user_id || !refresh_token) throw 'Отсутствуют необходимые данные или были переданы пустые поля';
    await this.pool.query(
      'delete from refresh_tokens where user_id=$1 and refresh_token=$2', [user_id, refresh_token],
    );
    return { message: 'OK' };
  }
}

module.exports = AuthorizationService;
