module.exports = function(sequelize, DataTypes) {
    return sequelize.define('keyword', {
        word: DataTypes.STRING,
        link: DataTypes.STRING
    }, {
        timestamps: false,
        tableName: 'keywords'
    });
};
