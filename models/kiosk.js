var models = require('./');

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('kiosk', {
        register: DataTypes.INTEGER,
        description: DataTypes.STRING,
        lat: DataTypes.DECIMAL(10, 6),
        lng: DataTypes.DECIMAL(10, 6),
        ble: DataTypes.STRING,
        last_play_file_id: DataTypes.INTEGER,
        last_play_at: DataTypes.DATE
    }, {
        timestamps: true,
        createdAt: 'create_at',
        updatedAt: 'update_at'
    });
};