'use strict';

var FacebookStrategy = require('passport-facebook');

class Strategy extends FacebookStrategy {
    constructor(options, verify) {
        super(options, verify);

        this.name = 'token-facebook';
    }

    authenticate(req) {
        const self = this;

        let accessToken = req.body.access_token;

        this._loadUserProfile(accessToken, function (err, profile) {
            if (err) return self.fail();

            function verified(err, user, info) {
                if (err) return self.error(err);
                if (!user) return self.fail(info);
                self.success(user, info);
            }

            try {
                if (self._passReqToCallback && self._verify.length == 6)
                    self._verify(req, accessToken, null, params, profile, verified);
                else if (self._passReqToCallback)
                    self._verify(req, accessToken, null, profile, verified);
                else if (self._verify.length == 5)
                    self._verify(accessToken, null, params, profile, verified);
                else
                    self._verify(accessToken, null, profile, verified);
            } catch (ex) {
                return self.error(ex);
            }
        });
    }
}

exports = module.exports = Strategy;
exports.Strategy = Strategy;
