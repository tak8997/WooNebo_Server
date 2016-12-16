module.exports = function(sequelize, DataTypes) {
    return sequelize.define('popularity', {
        user_id: DataTypes.INTEGER,
        product_id: DataTypes.INTEGER
    }, {
        timestamps: true,
        createdAt: 'create_at',
        updatedAt: false,
        tableName: 'popularities'
    });
};
