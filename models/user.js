module.exports = (sequelize, DataTypes)=>{
    return sequelize.define('user', {
        email: DataTypes.STRING,
        name: DataTypes.STRING,
        token: DataTypes.STRING,
        last_login_at: DataTypes.DATE
    }, {
        timestamps: true,
        createdAt: 'create_at',
        updatedAt: 'update_at'
    });
};
