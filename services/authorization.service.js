/* eslint-disable no-return-await */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-throw-literal */
/* eslint-disable object-curly-newline */
/* eslint-disable camelcase */
const jwt = require('jsonwebtoken');
const tokenGenerator = require('rand-token');
const moment = require('moment');
const fs = require('fs-extra');
const path = require('path');
const AuthorizationUtils = require('../utils/authorization.utils');

/**
 * Сервис авторизации
 */
class AuthorizationService {
  constructor(sequelize) {
    this.RefreshTokenModel = sequelize.models.refresh_token;
    this.UserModel = sequelize.models.user;
    this.sequelize = sequelize;
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
    await this.sequelize.transaction(async (transaction) => {
      const imageName = `${username}_logo${path.extname(image.name)}`;
      const imagePath = path.join(__dirname, '../images', imageName);
      await this.UserModel.create({
        username,
        password: AuthorizationUtils.encrypt(password),
        image: `/images/${imageName}`,
      });
      await new Promise((resolve, reject) => {
        fs.createReadStream(image.path)
          .pipe(fs.createWriteStream(imagePath))
          .on('error', (err) => {
            transaction.rollback();
            reject(err);
          })
          .on('finish', () => resolve());
      });
    });
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
    const user = await this.UserModel.findOne({ username });
    if (!user) throw { message: 'Пользователь не найден', statusCode: 404 };
    if (password !== AuthorizationUtils.decrypt(user.password)) throw { message: 'Неверный пароль' };
    const token = jwt.sign({ user_id: user.id }, process.env.SECRET_KEY, { expiresIn: 1800 });
    const refresh_token = tokenGenerator.uid(128);
    await this.RefreshTokenModel.upsert({ user_id: user.id, refresh_token, expiration_time: moment().add(8, 'hours') });
    return {
      username: user.username,
      user_image: user.image,
      token,
      refresh_token,
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
    const usersRefreshToken = await this.RefreshTokenModel.findOne({ where: { user_id } });
    if (!usersRefreshToken) throw { statusCode: 404, message: 'Токен отсутствует' };
    if (usersRefreshToken.refresh_token !== refresh_token) throw 'Токены не совпадают';
    if (moment().isAfter(usersRefreshToken.expiration_time)) throw 'Время жизни токена истекло';
    return {
      token: jwt.sign({ user_id }, process.env.SECRET_KEY, { expiresIn: 1800 }),
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
    await this.RefreshTokenModel.destroy({ where: { refresh_token, user_id } });
    return { message: 'OK' };
  }
}

module.exports = AuthorizationService;
