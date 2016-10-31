function errorHandler() {};

module.exports = errorHandler;

errorHandler.logError = function(err, req, res, next) {
    console.error(err.stack);
    next(err);
}
errorHandler.defaultError = function(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }
    res.status(500);
}
