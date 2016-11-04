module.exports = function(sequelize, DataTypes) {
    return sequelize.define('mediaFileConfig', {
        file_id: DataTypes.INTEGER,
        product_id: DataTypes.INTEGER,
        play_time_at: DataTypes.INTEGER
    }, {
        timestamps: true,
        createdAt: 'create_at',
        updatedAt: 'update_at',
        tableName: 'media_file_configs'
    });
};
