module.exports = (sequelize, DataTypes) => sequelize.define('refresh_token', {
  refresh_token: {
    type: DataTypes.STRING,
    validate: {
      notEmpty: {
        msg: 'Токен не может быть пустым',
      },
    },
  },
  user_id: {
    type: DataTypes.INTEGER,
    unique: {
      msg: 'Для каждого пользователя может быть только один refreshToken',
    },
    validate: {
      notEmpty: {
        msg: 'Идентификатор пользователя не может быть пустым',
      },
    },
  },
  expiration_time: {
    type: DataTypes.DATE,
    validate: {
      notEmpty: {
        msg: 'Время жизни токена не может отсутствовать',
      },
    },
  },
});
