module.exports = function(sequelize, DataTypes) {
    return sequelize.define('popularity', {
        user_id: DataTypes.INTEGER,
        product_id: DataTypes.INTEGER
    }, {
        timestamps: false,
        tableName: 'popularities'
    });
};
