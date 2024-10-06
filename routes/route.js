const router = require('express').Router();
const {registerUser, Login} = require('../controller/authcontroller');
// Routes
router.get('/', (req, res) => {
    res.send('API is running...');
});

router.post('/register',registerUser);
router.post('/login',Login);


module.exports = router;
