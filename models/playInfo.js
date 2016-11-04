module.exports = function(sequelize, DataTypes) {
    return sequelize.define('playInfo', {
        kiosk_id: DataTypes.INTEGER,
        file_id: DataTypes.INTEGER,
        play_at: DataTypes.DATE
    }, {
        timestamps: false,
        tableName: 'play_infos'
    });
};
