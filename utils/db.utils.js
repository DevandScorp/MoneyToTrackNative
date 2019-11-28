/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const fs = require('fs-extra');
const path = require('path');
const Sequelize = require('sequelize');

class DatabaseUtils {
  constructor() {
    /** переменная для хранения экземпляра подключения к БД */
    this.sequelize = null;
    /** Порядок следования импортов задан статически для правильной прогрузки отношений бд */
    this.models = [
      'user.model.js',
      'refresh_token.model.js',
      'list.model.js',
      'list_item.model.js',
    ];
  }

  /**
   * Импорт моделей таблиц
   */
  async importModels() {
    for (const model of this.models) {
      this.sequelize.import(path.join(__dirname, `../models/${model}`));
    }
  }

  /**
   * Инициализация бд и подключение к ней
   */
  async initializeDatabase() {
    this.sequelize = new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        port: process.env.DB_PORT,
        host: process.env.DB_HOST,
        dialect: 'postgres',
        logging: false,
        define: {
          underscored: true,
        },
      },
    );
    await this.sequelize.authenticate();
    console.log('DB connection has been established successfully.');
    await this.importModels();
  }
}

module.exports = new DatabaseUtils();
