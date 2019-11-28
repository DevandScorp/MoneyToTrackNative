/**
 * Машруты /api/list
 * @namespace ListRoutes
 */
const express = require('express');
const authorizationMiddleware = require('../middlewares/authorization.middleware');
const ListController = require('../controllers/list.controller');

const router = express.Router();

/**
 * Мидлварь для проверки авторизации пользоватля
 */
router.use(authorizationMiddleware);
router.use((req, res, next) => {
  if (!req.headers.user_id) return res.sendErr({ statusCode: 401, message: 'Пользователь не авторизирован' });
  return next();
});
/**
 * @name Получение одного или всех списков
 * @memberof! ListRoutes
 * @path {GET} /api/list
 * @headers {number} user_id - идентификатор пользователя
 * @query {number} [id] - идентификатор списка
 * @code {200} Успешно
 * @code {500} Ошибка сервера
 */
router.get('/', ListController.getList);
/**
 * @name Получение общей суммы пользователя
 * @memberof! ListRoutes
 * @path {GET} /api/list/total
 * @headers {number} user_id - идентификатор пользователя
 * @code {200} Успешно
 * @code {500} Ошибка сервера
 */
router.get('/total', ListController.getTotalAmount);
/**
 * @name Получение выписки за период( для диаграммы )
 * @memberof! ListRoutes
 * @path {GET} /api/list/period/diagram
 * @headers {number} user_id - идентификатор пользователя
 * @query {date} dateFrom - дата с
 * @query {date} dateTo - дата по
 * @code {200} Успешно
 * @code {500} Ошибка сервера
 */
router.get('/period/diagram', ListController.getPeriodAmount);
/**
 * @name Получение выписки за период( pdf )
 * @memberof! ListRoutes
 * @path {GET} /api/list/period
 * @headers {number} user_id - идентификатор пользователя
 * @query {date} dateFrom - дата с
 * @query {date} dateTo - дата по
 * @code {200} Успешно
 * @code {500} Ошибка сервера
 */
router.get('/period/pdf', ListController.getPeriodAmount);
/**
 * @name Получение выписки за период( сумма )
 * @memberof! ListRoutes
 * @path {GET} /api/list/period
 * @headers {number} user_id - идентификатор пользователя
 * @query {date} dateFrom - дата с
 * @query {date} dateTo - дата по
 * @code {200} Успешно
 * @code {500} Ошибка сервера
 */
router.get('/period/total', ListController.getPeriodAmount);
/**
 * @name Создание нового списка
 * @memberof! ListRoutes
 * @path {POST} /api/list
 * @headers {number} user_id - идентификатор пользователя
 * @body {string} name - наименование списка
 * @code {200} Успешно
 * @code {500} Ошибка сервера
 */
router.post('/', ListController.addList);
/**
 * @name Удаление списка
 * @memberof! ListRoutes
 * @path {DELETE} /api/list
 * @headers {number} user_id - идентификатор пользователя
 * @query {string} id - идентификатор списка
 * @code {200} Успешно
 * @code {500} Ошибка сервера
 */
router.delete('/', ListController.deleteList);
/**
 * @name Создание нового элемента списка
 * @memberof! ListRoutes
 * @path {POST} /api/list/item
 * @headers {number} user_id - идентификатор пользователя
 * @body {number} list_id - идентификатор списка
 * @body {string} name - название элемента списка
 * @body {number} type - тип элемента списка: доход или расход
 * @body {number} amount - сумма
 * @code {200} Успешно
 * @code {500} Ошибка сервера
 */
router.post('/item', ListController.addListItem);
/**
 * @name Удаление элемента списка
 * @memberof! ListRoutes
 * @path {DELETE} /api/list/item
 * @headers {number} user_id - идентификатор пользователя
 * @query {number} list_item_id - идентификатор элемента списка
 * @query {number} list_id - идентификатор списка
 * @code {200} Успешно
 * @code {500} Ошибка сервера
 */
router.delete('/item', ListController.deleteListItem);

module.exports = router;
