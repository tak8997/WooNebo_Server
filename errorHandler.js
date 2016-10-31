function errorHandler() {};

module.exports = errorHandler;

errorHandler.defaultError = function(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }
    res.status(500);
}
errorHandler.logError = function(err, req, res, next) {
    console.error(err.stack);
    next(err);
}
