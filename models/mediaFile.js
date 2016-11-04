module.exports = function(sequelize, DataTypes) {
    return sequelize.define('mediaFile', {
        file_name: DataTypes.STRING,
        description: DataTypes.STRING,
        register: DataTypes.INTEGER
    }, {
        timestamps: false,
        tableName: 'media_files'
    });
};
