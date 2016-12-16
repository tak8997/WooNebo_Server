import Sequelize from 'sequelize';

var options = {
    timezone: '+09:00',
    logging: false
}
var sequelize = new Sequelize('mysql://woonebo:dbmysql@localhost:3306/woonebo', options);

//load models
var models = [
    'admin',
    'kiosk',
    'user',
    'mediaFile',
    'mediaFileConfig',
    'product',
    'searchLog',
    'playInfo',
    'keyword',
    'popularity'
];
models.forEach(function(model) {
    module.exports[model] = sequelize.import('./' + model);
});

//테이블 관계 정의
(function(m) {
    m.admin.hasMany(m.kiosk, { foreignKey: 'register' });
    m.admin.hasMany(m.product, { foreignKey: 'register' });
    m.admin.hasMany(m.mediaFile, { foreignKey: 'register' });
    m.kiosk.hasMany(m.playInfo, { foreignKey: 'kiosk_id' });
    m.mediaFile.hasMany(m.kiosk, { foreignKey: 'last_play_file_id' });
    m.mediaFile.hasMany(m.mediaFileConfig, { foreignKey: 'file_id' });
    m.mediaFile.hasMany(m.playInfo, { foreignKey: 'file_id' });
    m.user.hasMany(m.searchLog, { foreignKey: 'user_id' });
    m.user.hasMany(m.popularity, { foreignKey: 'user_id' });
    m.product.hasMany(m.searchLog, { foreignKey: 'product_id' });
    m.product.hasMany(m.mediaFileConfig, { foreignKey: 'product_id' });
    m.product.hasMany(m.popularity, { foreignKey: 'product_id' });
    m.keyword.hasMany(m.mediaFile, { foreignKey: 'key' });

    m.kiosk.belongsTo(m.admin, { foreignKey: 'register' });
    m.kiosk.belongsTo(m.mediaFile, { foreignKey: 'last_play_file_id' });
    m.mediaFile.belongsTo(m.admin, { foreignKey: 'register' });
    m.mediaFile.belongsTo(m.keyword, { foreignKey: 'key' });
    m.mediaFileConfig.belongsTo(m.mediaFile, { foreignKey: 'file_id' });
    m.mediaFileConfig.belongsTo(m.product, { foreignKey: 'product_id' });
    m.playInfo.belongsTo(m.mediaFile, { foreignKey: 'file_id' });
    m.playInfo.belongsTo(m.kiosk, { foreignKey: 'kiosk_id' });
    m.searchLog.belongsTo(m.user, { foreignKey: 'user_id' });
    m.searchLog.belongsTo(m.product, { foreignKey: 'product_id' });
    m.popularity.belongsTo(m.user, { foreignKey: 'user_id' });
    m.popularity.belongsTo(m.product, { foreignKey: 'product_id' });
})(module.exports);

sequelize
    .authenticate()
    .then(function(err) {
        console.log("DB is connected!!");
    })
    .catch(function(err) {
        console.log("Unable to connect to the database: ", err);
    });


module.exports.sequelize = sequelize;
