/* eslint-disable no-throw-literal */
/* eslint-disable camelcase */

const AuthorizationService = require('../services/authorization.service');
const DatabaseRepository = require('../repositories');

const authorizationService = new AuthorizationService({ DatabaseRepository });


/** Класс работы с авторизацией */
class AuthorizationController {
  /**
   * Маршрут регистрации
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @returns {Promise<void>}
   */
  static async signUp(req, res) {
    try {
      const { username, password } = req.fields;
      const { image } = req.files;
      const result = await authorizationService.signUp({
        username, password, image,
      });
      return res.sendRes(result);
    } catch (err) {
      return res.sendErr(err);
    }
  }

  /**
   * Маршрут авторизации
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @returns {Promise<void>}
   */
  static async login(req, res) {
    try {
      const { username, password } = req.body;
      const result = await authorizationService.login({ username, password });
      return res.sendRes(result);
    } catch (err) {
      return res.sendErr(err);
    }
  }

  /**
   * Проверка валидности токена
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @returns {Promise<void>}
   */
  static async checkToken(req, res) {
    try {
      if (!req.headers.user_id) throw { message: 'Пользователь не авторизирован', statusCode: 401 };
      return res.sendRes({
        user_id: req.headers.user_id,
      });
    } catch (err) {
      return res.sendErr(err);
    }
  }

  /**
   * Обновление токена с помощью соответствующего токена
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @returns {Promise<void>}
   */
  static async refreshToken(req, res) {
    try {
      const { refresh_token } = req.body;
      const { user_id } = req.headers;
      const result = await authorizationService.refreshToken({ user_id, refresh_token });
      return res.sendRes(result);
    } catch (err) {
      return res.sendErr(err);
    }
  }

  /**
   * Отклонить токен обновления
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @returns {Promise<void>}
   */
  static async rejectToken(req, res) {
    try {
      const { refresh_token } = req.body;
      const { user_id } = req.headers;
      const result = await authorizationService.rejectToken({ refresh_token, user_id });
      return res.sendRes(result);
    } catch (err) {
      return res.sendErr(err);
    }
  }
}
module.exports = AuthorizationController;
