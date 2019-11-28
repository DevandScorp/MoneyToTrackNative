/**
 * Машруты /api/authorization
 * @namespace AuthorizationRoutes
 */
const express = require('express');
const formidable = require('express-formidable');
const authorizationMiddleware = require('../middlewares/authorization.middleware');
const AuthorizationController = require('../controllers/authorization.controller');

const router = express.Router();
/**
 * @name Регистрация нового пользователя
 * @memberof! AuthorizationRoutes
 * @path {POST} /api/authorization/signup
 * @file {object} image - аватарка пользователя
 * @field {string} username - логин
 * @field {string} password - пароль
 * @code {200} Успешно
 * @code {500} Ошибка сервера
 */
router.post('/signup', formidable(), AuthorizationController.signUp);
/**
 * @name Авторизация пользователя
 * @memberof! AuthorizationRoutes
 * @path {POST} /api/authorization/login
 * @body {string} username - имя пользователя
 * @body {string} password - пароль
 * @code {200} Успешно
 * @code {500} Ошибка сервера
 */
router.post('/login', AuthorizationController.login);
/**
 * Мидлварь, проверяющая авторизацию
 */
router.use(authorizationMiddleware);
/**
 * @name Проверка валидности токена
 * @memberof! AuthorizationRoutes
 * @path {POST} /api/authorization/token/check
 * @body {string} token - токен авторизации
 * @code {200} Успешно
 * @code {500} Ошибка сервера
 */
router.post('/token/check', AuthorizationController.checkToken);
/**
 * @name Обновление токена
 * @memberof! AuthorizationRoutes
 * @path {POST} /api/authorization/token/refresh
 * @body {string} refresh_token - refreshToken авторизации
 * @body {string} username - логин пользователя
 * @code {200} Успешно
 * @code {500} Ошибка сервера
 */
router.post('/token/refresh', AuthorizationController.refreshToken);
/**
 * @name Отклонить токен обновления
 * @memberof! AuthorizationRoutes
 * @path {POST} /api/authorization/token/reject
 * @body {string} refreshToken - refreshToken авторизации
 * @code {200} Успешно
 * @code {500} Ошибка сервера
 */
router.post('/token/reject', AuthorizationController.rejectToken);

module.exports = router;
