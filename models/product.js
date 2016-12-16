module.exports = (sequelize, DataTypes)=>{
    return sequelize.define('product', {
        register: DataTypes.INTEGER,
        product_name: DataTypes.STRING,
        price: DataTypes.INTEGER,
        image: DataTypes.STRING,
        description: DataTypes.STRING,
        url: DataTypes.STRING
    }, {
        timestamps: true,
        createdAt: 'create_at',
        updatedAt: 'update_at',
    });
};
