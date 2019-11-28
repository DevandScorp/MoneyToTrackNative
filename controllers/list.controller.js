/* eslint-disable no-throw-literal */
/* eslint-disable camelcase */

const ListService = require('../services/list.service');
const DatabaseUtils = require('../utils/db.utils');

const listService = new ListService(DatabaseUtils.sequelize);


/** Класс работы с списком и элементами списка */
class ListController {
  /**
   * Получение доходов/расходов за период
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @returns {Promise<void>}
   */
  static async getPeriodAmount(req, res) {
    try {
      const { user_id } = req.headers;
      const { dateFrom, dateTo } = req.query;
      const result = await listService.getPeriodAmount({
        user_id, dateFrom, dateTo, path: req.path,
      });
      if (!result) throw 'Данные не найдены';
      return res.sendRes(result);
    } catch (err) {
      return res.sendErr(err);
    }
  }

  /**
   * Получение общей суммы пользователя
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @returns {Promise<void>}
   */
  static async getTotalAmount(req, res) {
    try {
      const { user_id } = req.headers;
      const result = await listService.getTotalAmount({ user_id });
      if (!result) throw 'Данные не найдены';
      return res.sendRes(result);
    } catch (err) {
      return res.sendErr(err);
    }
  }

  /**
   * Получение одного или всех списков
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @returns {Promise<void>}
   */
  static async getList(req, res) {
    try {
      const { user_id } = req.headers;
      const { id } = req.query;
      const result = await listService.getList({
        user_id, id,
      });
      if (!result) throw 'Данные не найдены';
      return res.sendRes(result);
    } catch (err) {
      return res.sendErr(err);
    }
  }

  /**
   * Добавление нового списка
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @returns {Promise<void>}
   */
  static async addList(req, res) {
    try {
      const { user_id } = req.headers;
      const { name } = req.body;
      const result = await listService.addList({
        user_id, name,
      });
      return res.sendRes(result);
    } catch (err) {
      return res.sendErr(err);
    }
  }

  /**
   * Добавление нового элемента списка
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @returns {Promise<void>}
   */
  static async addListItem(req, res) {
    try {
      const { user_id } = req.headers;
      const {
        list_id, type, amount, name,
      } = req.body;
      const result = await listService.addListItem({
        user_id, list_id, type, amount, name,
      });
      return res.sendRes(result);
    } catch (err) {
      return res.sendErr(err);
    }
  }

  /**
   * Удаление cgbcrf
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @returns {Promise<void>}
   */
  static async deleteList(req, res) {
    try {
      const { user_id } = req.headers;
      const { id } = req.query;
      const result = await listService.deleteList({
        user_id, id,
      });
      return res.sendRes(result);
    } catch (err) {
      return res.sendErr(err);
    }
  }

  /**
   * Удаление элемента из списка
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @returns {Promise<void>}
   */
  static async deleteListItem(req, res) {
    try {
      const { user_id } = req.headers;
      const { list_id, list_item_id } = req.query;
      const result = await listService.deleteListItem({
        user_id, list_id, list_item_id,
      });
      return res.sendRes(result);
    } catch (err) {
      return res.sendErr(err);
    }
  }
}
module.exports = ListController;
