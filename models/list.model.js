module.exports = (sequelize, DataTypes) => sequelize.define('list', {
  name: {
    type: DataTypes.STRING,
    validate: {
      notEmpty: {
        msg: 'Список должен иметь название',
      },
    },
  },
  user_id: {
    type: DataTypes.INTEGER,
    references: {
      model: sequelize.models.user,
      key: 'id',
    },
  },
  total_amount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
});
