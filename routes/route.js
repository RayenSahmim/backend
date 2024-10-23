const router = require('express').Router();
const {registerUser, Login, Logout,dashboard,checkSession,AddRoom,GetRooms} = require('../controller/authcontroller');
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
// Example API route to get rooms by user
router.get('/rooms',GetRooms);

router.post('/rooms',AddRoom);
  
  
  


module.exports = router;
