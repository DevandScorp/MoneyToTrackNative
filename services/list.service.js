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

const pdfUtils = require('../utils/pdf.utils');

/**
 * Сервис работы со списками и с их элементами
 */
class ListService {
  constructor({ DatabaseRepository }) {
    this.pool = DatabaseRepository.pool;
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
    const lists = (await this.pool.query('select * from lists where user_id=$1', [user_id])).rows;
    let result;
    switch (path) {
      case '/period/total':
        [result] = (await this.pool.query(`
         select sum(case
                        when amount < 0 then
                            amount
                        else
                            0
                        end
                    ) as expense,
                sum(case
                        when amount > 0 then
                            amount
                        else
                            0
                        end
                    ) as income
        from list_items
        where list_id in (${lists.map((list) => list.id).join(', ')})
        and created_at between $1 and $2`,
        [`'${dateFrom.format('YYYY-MM-DD')}'`, `'${dateTo.format('YYYY-MM-DD')} 24:00:00'`])).rows;
        break;
      case '/period/pdf':
        const data = (await this.pool.query(`
        select * from list_items
        where list_id in (${lists.map((list) => list.id).join(', ')})
        and created_at between $1 and $2`,
        [`'${dateFrom.format('YYYY-MM-DD')}'`, `'${dateTo.format('YYYY-MM-DD')} 24:00:00'`])).rows;
        result = pdfUtils.generatePdf(data);
        break;
      case '/period/diagram':
        result = (await this.pool.query(`
        select * from list_items
        where list_id in (${lists.map((list) => list.id).join(', ')})
        and created_at between $1 and $2`,
        [`'${dateFrom.format('YYYY-MM-DD')}'`, `'${dateTo.format('YYYY-MM-DD')} 24:00:00'`])).rows;
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
    return (await this.pool.query('select total_amount from users where id=$1', [user_id])).rows[0];
  }

  /**
   * Создание списка(группы) доходов/расходов
   * @param {object} param - объект запроса
   * @param {number} param.user_id - идентификатор пользователя
   * @param {string} param.name - наименование списка
   */
  async addList({ user_id, name }) {
    if (!user_id || !name) throw 'Отсутствуют необходимые данные или были переданы пустые поля';
    await this.pool.query('insert into lists (user_id, name) values ($1, $2)', [user_id, name]);
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
    const [listToBeDestroyed] = (await this.pool.query('select * from lists where id=$1', [id])).rows;
    if (!listToBeDestroyed) throw 'Данного списка не существует';
    await this.pool.query('delete from lists where id=$1', [id]);
    /**
     * Обновление суммы у пользователя
     */
    await this.pool.query('update users set total_amount=total_amount-$1 where id=$2', [listToBeDestroyed.amount, user_id]);
    return { message: 'OK' };
  }

  /**
   * Создание элемента списка
   * @param {object} param - объект запроса
   * @param {number} param.user_id - идентификатор пользователя
   * @param {number} param.list_id - идентификатор списка
   * @param {number} param.amount - сумма дохода/расхода
   * @param {string} param.name - наименование элемента списка
   * @param {string} param.description - описание элемента списка
   * @param {date} param.date - дата создания элемента списка
   */
  async addListItem({ user_id, list_id, amount, name, description, date }) {
    if (!user_id || !name || !amount || !list_id || !description) throw 'Отсутствуют необходимые данные или были переданы пустые поля';
    if (!(await this.pool.query('select * from lists where id=$1 and user_id=$2', [list_id, user_id])).rows.length) throw 'Данного списка не существует';
    /**
     * Создание элемента списка
     */
    await this.pool.query('insert into list_items(list_id, name, amount, description, created_at) values($1, $2, $3, $4, $5)',
      [list_id, name, amount, description, date]);
    /**
     * Обновление суммы у списка
     */
    await this.pool.query('update lists set total_amount=total_amount+$1 where id=$2', [amount, list_id]);
    /**
     * Обновление суммы у пользователя
     */
    await this.pool.query('update users set total_amount=total_amount+$1 where id=$2', [amount, user_id]);
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
    if (!(await this.pool.query('select * from lists where id=$1', [list_id])).rows.length) throw 'Данного списка не существует';
    const [listItemToBeDestroyed] = (await this.pool.query('select * from list_items where list_id=$1 and id=$2', [list_id, list_item_id])).rows;
    if (!listItemToBeDestroyed) throw 'Данного элемента нет в списке';
    await this.pool.query('delete from list_items where id=$1 and list_id=$2', [list_item_id, list_id]);
    /**
     * Обновление суммы у списка
     */
    await this.pool.query('update lists set total_amount=total_amount-$1 where id=$2', [listItemToBeDestroyed.amount, list_id]);
    /**
     * Обновление суммы у пользователя
     */
    await this.pool.query('update users set total_amount=total_amount-$1 where id=$2', [listItemToBeDestroyed.amount, user_id]);
    return { message: 'OK' };
  }

  /**
   * Получение всех элементов всех списков
   * @param {object} param - объект запроса
   * @param {number} param.user_id - идентификатор пользователя
   */
  async getListItems({ user_id }) {
    return (await this.pool.query(`
          select list_items.id,
              list_items.name,
              list_items.amount,
              list_items.description
          from lists
                inner join list_items on lists.id = list_items.list_id
          where user_id = $1`, [user_id])).rows;
  }

  /**
   * Получение одного или всех списков
   * @param {object} param - объект запроса
   * @param {number} [param.id] - идентификатор конкретного списка
   */
  async getList({ id }) {
    let result;
    if (id) {
      const [list] = (await this.pool.query('select * from lists where id=$1', [id])).rows;
      list.list_items = (await this.pool.query('select * from list_items where list_id=$1', [id])).rows;
      result = list;
    } else {
      result = (await this.pool.query('select * from lists')).rows;
    }
    return result;
  }
}

module.exports = ListService;
