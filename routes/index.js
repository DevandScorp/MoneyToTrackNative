const express = require('express');

const router = express.Router();
const authorizationRoutes = require('./authorization.routes');
const listRoutes = require('./list.routes');

router.use('/authorization', authorizationRoutes);
router.use('/list', listRoutes);

module.exports = router;
