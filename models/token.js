module.exports = function(sequelize, DataTypes) {
    return sequelize.define('token', {
        token: DataTypes.STRING,
        user_id: DataTypes.INTEGER,
    }, {
        timestamps: true,
        createdAt: 'create_at',
        updatedAt: 'update_at',
        tableName: 'tokens'
    });
};
