module.exports = (sequelize, DataTypes)=>{
    return sequelize.define('admin', {
        email: DataTypes.STRING,
        name: DataTypes.STRING,
        pwd: DataTypes.STRING,
        last_login_at: DataTypes.DATE
    }, {
        timestamps: true,
        createdAt: 'create_at',
        updatedAt: 'update_at'
    });
};
