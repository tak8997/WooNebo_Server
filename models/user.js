module.exports = function(sequelize, DataTypes) {
    return sequelize.define('user', {
        email: DataTypes.STRING,
        pwd: DataTypes.STRING,
        name: DataTypes.STRING,
        age: DataTypes.INTEGER,
        sex: DataTypes.BOOLEAN,
        last_login_at: DataTypes.DATE
    }, {
        timestamps: true,
        createdAt: 'create_at',
        updatedAt: 'update_at'
    });
};
