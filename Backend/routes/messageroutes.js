const express = require('express');
const protect = require('../middleware/auth');
const { getMessages, getUsers, sendMessages } = require('../Controllers/msgController');

const router = express.Router();

console.log({
  protect,
  getMessages,
  getUsers,
  sendMessages
});
console.log('Message routes loaded successfully');

router.get('/users', protect, getUsers);
router.get('/:id', protect, getMessages);
router.post('/send/:id', protect, sendMessages);



module.exports = router;
