module.exports = function(sequelize, DataTypes) {
    return sequelize.define('product', {
        register: DataTypes.INTEGER,
        product_name: DataTypes.STRING,
        price: DataTypes.INTEGER,
        description: DataTypes.STRING,
        url: DataTypes.STRING
    }, {
        timestamps: true,
        createdAt: 'create_at',
        updatedAt: 'update_at',
    });
};
