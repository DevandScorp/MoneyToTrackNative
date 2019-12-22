const { Pool } = require('pg');

/**
 * Общий класс для пула
 */
class DatabasePool {
  constructor() {
    this.pool = null;
  }

  initDatabase() {
    this.pool = new Pool();
  }
}
module.exports = new DatabasePool();
