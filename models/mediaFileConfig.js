module.exports = (sequelize, DataTypes)=>{
    return sequelize.define('mediaFileConfig', {
        file_id: DataTypes.INTEGER,
        product_id: DataTypes.INTEGER,
        play_time_at: DataTypes.INTEGER,
        display_time: DataTypes.INTEGER
    }, {
        timestamps: false,
        tableName: 'media_file_configs'
    });
};
