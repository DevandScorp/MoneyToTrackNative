/* eslint-disable no-return-assign */
/* eslint-disable no-case-declarations */
/* eslint-disable no-param-reassign */
// @ts-nocheck
/* eslint-disable no-return-await */
/* eslint-disable max-len */
/* eslint-disable object-curly-newline */
/* eslint-disable camelcase */
/* eslint-disable no-throw-literal */
const moment = require('moment');
const { Op } = require('sequelize');
const amountTypeEnum = require('../enums/amountType.enum');
/**
 * Сервис работы со списками и с их элементами
 */
class ListService {
  constructor(sequelize) {
    this.ListModel = sequelize.models.list;
    this.ListItemModel = sequelize.models.list_item;
    this.UserModel = sequelize.models.user;
    this.sequelize = sequelize;
  }

  /**
   * Получение доходов/расходов за период
   * @param {object} param - объект запроса
   * @param {number} param.user_id - идентификатор пользователя
   * @param {Date} param.dateFrom - дата с
   * @param {Date} param.dateTo - дата по
   * @param {string} param.path - путь запроса для выдачи соответствующего ответа
   */
  async getPeriodAmount({ user_id, dateFrom, dateTo, path }) {
    if (!user_id || !dateFrom || !dateTo) throw 'Отсутствуют необходимые данные или были переданы пустые поля';
    dateFrom = moment(dateFrom, 'DD.MM.YYYY');
    dateTo = moment(dateTo, 'DD.MM.YYYY');
    if (!dateFrom.isValid() || !dateTo.isValid()) throw 'Невалидный формат даты';
    if (dateFrom.isAfter(dateTo)) throw 'Дата с позже, чем дата по';
    let result = await this.ListItemModel.findAll({
      where: {
        created_at: {
          [Op.gte]: dateFrom.toDate(),
          [Op.lte]: dateTo.set({ hour: 23, minute: 59, second: 59 }).toDate(),
        } },
      attributes: ['amount', 'type', 'createdAt'],
    });
    switch (path) {
      case '/period/total':
        let income = 0;
        let expense = 0;
        result.forEach((item) => (item.type === amountTypeEnum.INCOME ? income += item.amount : expense += item.amount));
        result = { income, expense };
        break;
      default:
        break;
    }
    return result;
  }

  /**
   * Получение общей суммы пользователя
   * @param {object} param - объект запроса
   * @param {number} param.user_id - идентификатор пользователя
   */
  async getTotalAmount({ user_id }) {
    if (!user_id) throw 'Отсутствуют необходимые данные или были переданы пустые поля';
    return await this.UserModel.findOne({
      where: { id: user_id },
      attributes: ['total_amount'],
    });
  }

  /**
   * Создание списка(группы) доходов/расходов
   * @param {object} param - объект запроса
   * @param {number} param.user_id - идентификатор пользователя
   * @param {string} param.name - наименование списка
   */
  async addList({ user_id, name }) {
    if (!user_id || !name) throw 'Отсутствуют необходимые данные или были переданы пустые поля';
    if (await this.ListModel.findOne({ where: { user_id, name } })) throw 'Список с таким названием уже существует';
    await this.ListModel.create({
      name,
      user_id,
    });
    return { message: 'OK' };
  }

  /**
   * Удаление списка
   * @param {object} param - объект запроса
   * @param {number} param.user_id - идентификатор пользователя
   * @param {number} param.id - идентификатор списка
   */
  async deleteList({ user_id, id }) {
    if (!user_id || !id) throw 'Отсутствуют необходимые данные или были переданы пустые поля';
    const listToBeDestroyed = await this.ListModel.findOne({ where: { user_id, id: +id } });
    if (!(listToBeDestroyed)) throw 'Данного списка не существует';
    await this.ListItemModel.destroy({ where: { listId: +id } });
    await this.ListModel.destroy({ where: { id: +id } });
    /**
     * Обновление суммы у пользователя
     */
    await this.UserModel.update({
      total_amount: this.sequelize.literal(`total_amount - ${listToBeDestroyed.total_amount}`) },
    { where: { id: user_id } });
    return { message: 'OK' };
  }

  /**
   * Создание элемента списка
   * @param {object} param - объект запроса
   * @param {number} param.user_id - идентификатор пользователя
   * @param {number} param.list_id - идентификатор списка
   * @param {number} param.type - тип элемента ( 0 - доходы, 1 - расходы)
   * @param {number} param.amount - сумма дохода/расхода
   * @param {string} param.name - наименование элемента списка
   */
  async addListItem({ user_id, list_id, type, amount, name }) {
    if (!user_id || !name || !amount || !list_id) throw 'Отсутствуют необходимые данные или были переданы пустые поля';
    if (!(await this.ListModel.findOne({ where: { user_id, id: list_id } }))) throw 'Данного списка не существует';
    if (await this.ListItemModel.findOne({ where: { list_id, name } })) throw 'Данный элемент уже присутствует в списке';
    /**
     * Создание элемента списка
     */
    await this.ListItemModel.create({
      name,
      list_id,
      type,
      amount,
    });
    /**
     * Обновление суммы у списка
     */
    await this.ListModel.update({
      total_amount: type === amountTypeEnum.INCOME
        ? this.sequelize.literal(`total_amount + ${amount}`)
        : this.sequelize.literal(`total_amount - ${amount}`) },
    { where: { id: list_id } });
    /**
     * Обновление суммы у пользователя
     */
    await this.UserModel.update({
      total_amount: type === amountTypeEnum.INCOME
        ? this.sequelize.literal(`total_amount + ${amount}`)
        : this.sequelize.literal(`total_amount - ${amount}`) },
    { where: { id: user_id } });
    return { message: 'OK' };
  }

  /**
   * Удаление элемента из списка
   * @param {object} param - объект запроса
   * @param {number} param.list_item_id - идентификатор элемента списка
   * @param {number} param.user_id - идентификатор пользователя
   * @param {number} param.list_id - идентификатор списка
   */
  async deleteListItem({ user_id, list_id, list_item_id }) {
    if (!user_id || !list_id || !list_item_id) throw 'Отсутствуют необходимые данные или были переданы пустые поля';
    if (!(await this.ListModel.findOne({ where: { user_id, id: +list_id } }))) throw 'Данного списка не существует';
    const listItemToBeDestroyed = await this.ListItemModel.findOne({ where: { list_id: +list_id, id: +list_item_id } });
    if (!(listItemToBeDestroyed)) throw 'Данного элемента нет в списке';
    await this.ListItemModel.destroy({ where: { list_id: +list_id, id: +list_item_id } });
    /**
     * Обновление суммы у списка
     */
    await this.ListModel.update({
      total_amount: listItemToBeDestroyed.type === amountTypeEnum.INCOME
        ? this.sequelize.literal(`total_amount - ${listItemToBeDestroyed.amount}`)
        : this.sequelize.literal(`total_amount + ${listItemToBeDestroyed.amount}`) },
    { where: { id: +list_id } });
    /**
     * Обновление суммы у пользователя
     */
    await this.UserModel.update({
      total_amount: listItemToBeDestroyed.type === amountTypeEnum.INCOME
        ? this.sequelize.literal(`total_amount - ${listItemToBeDestroyed.amount}`)
        : this.sequelize.literal(`total_amount + ${listItemToBeDestroyed.amount}`) },
    { where: { id: user_id } });
    return { message: 'OK' };
  }

  /**
   * Получение одного или всех списков
   * @param {object} param - объект запроса
   * @param {number} param.user_id - идентификатор пользователя
   * @param {number} [param.id] - идентификатор конкретного списка
   */
  async getList({ user_id, id }) {
    let result;
    if (id) {
      result = await this.ListModel.findOne({
        where: { user_id, id: +id },
        attributes: { exclude: ['createdAt', 'updatedAt'] },
        include: [
          {
            model: this.ListItemModel,
            attributes: { exclude: ['createdAt', 'updatedAt', 'listId'] },
          },
        ],
      });
    } else {
      result = await this.ListModel.findAll({
        where: { user_id },
        attributes: { exclude: ['createdAt', 'updatedAt'] },
      });
    }
    return result;
  }
}

module.exports = ListService;
