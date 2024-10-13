const router = require('express').Router();
const {registerUser, Login, Logout,dashboard,checkSession} = require('../controller/authcontroller');
const isAuthenticated = require('../middleware/authMiddleware');
// Routes
router.get('/', (req, res) => {
    res.send('API is running...');
});

router.post('/register',registerUser);
router.post('/login',Login);
router.post('/logout',Logout);
router.get('/dashboard',isAuthenticated,dashboard);
router.get('/check-session',checkSession);
  


module.exports = router;
