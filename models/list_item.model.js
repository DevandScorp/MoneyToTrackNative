module.exports = (sequelize, DataTypes) => {
  const listItem = sequelize.define('list_item', {
    name: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: 'Элемент должен иметь название',
        },
      },
    },
    list_id: {
      type: DataTypes.INTEGER,
      references: {
        model: sequelize.models.list,
        key: 'id',
      },
    },
    amount: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: 'Сумма не может быть пустой',
        },
      },
    },
    type: {
      type: DataTypes.INTEGER,
      validate: {
        isIn: [[0, 1]],
      },
    },
    description: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: 'Должно присутствовать описание',
        },
      },
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  });
  sequelize.models.list.hasMany(listItem);
  listItem.belongsTo(sequelize.models.list);

  return listItem;
};
