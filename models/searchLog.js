module.exports = (sequelize, DataTypes)=>{
    return sequelize.define('searchLog', {
        user_id: DataTypes.INTEGER,
        product_id: DataTypes.INTEGER,
        search_at: DataTypes.DATE
    }, {
        timestamps: false,
        tableName: 'search_logs'
    });
};
