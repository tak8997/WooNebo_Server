module.exports = function(sequelize, DataTypes) {
    return sequelize.define('popularity', {
        user_id: DataTypes.INTEGER,
        key: DataTypes.INTEGER
    }, {
        timestamps: false,
        tableName: 'popularities'
    });
};
