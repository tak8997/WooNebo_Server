module.exports = function(sequelize, DataTypes) {
    return sequelize.define('mediaFile', {
        file_name: DataTypes.STRING,
        description: DataTypes.STRING,
        total_play_time: DataTypes.INTEGER,
        status: DataTypes.STRING,
        register: DataTypes.INTEGER,
        key: DataTypes.INTEGER
    }, {
        timestamps: true,
        createdAt: 'create_at',
        updatedAt: 'update_at',
        tableName: 'media_files'
    });
};
