/* utils */
const { Website, User } = require('../utils/mongoose.js');
const buildError = require('../utils/buildError.js');
const requestIP = require('../utils/requestIP.js');

/* deps */
const fs = require('fs');
const path = require('path');
const Bowser = require('bowser');
const { Reader } = require('maxmind');
const gdb = fs.readFileSync(path.resolve(__dirname, '../../../api/assets/GeoLite2-Country.mmdb'));
const maxmind = new Reader(gdb);

module.exports = (router) => {
  // debug route
  router.get('/debug', async (req, res) => {
    console.log(`[debug] ${Date.now()} debug route start`);

    try {
      const response = {};

      // Bowser check
      const ua = req.get('User-Agent');
      const bowser = Bowser.parse(ua);
      response.bowser = bowser;

      // database check
      const results = await Promise.all([Website.findOne({}).lean(), User.findOne({}).lean()]);
      response.db = results;

      // geodb check
      const internal = { ip: '1.1.1.1', ...maxmind.get('1.1.1.1') };
      response.maxmind = {
        internal,
      };
      const userIP = requestIP(req);
      if (userIP) {
        const user = maxmind.get(userIP);
        response.maxmind.user = { ip: userIP, ...user };
      }

      console.log(`[debug] ${Date.now()} debug route done`);
      res.send(response);
    } catch (e) {
      console.log(e.stack);
      throw buildError(500, 'debug test failed');
    }
  });
};