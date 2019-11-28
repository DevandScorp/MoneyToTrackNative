module.exports = (sequelize, DataTypes) => sequelize.define('user', {
  username: {
    type: DataTypes.STRING,
    unique: {
      msg: 'Данный пользователь уже существует',
    },
  },
  password: {
    type: DataTypes.STRING,
    validate: {
      notEmpty: {
        msg: 'Поле пароль не может быть пустым',
      },
    },
  },
  image: {
    type: DataTypes.STRING,
    validate: {
      notEmpty: {
        msg: 'Должна присутствовать картинка пользователя',
      },
    },
  },
  total_amount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
});
