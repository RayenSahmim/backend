const router = require('express').Router();
const multer = require('multer');
const {registerUser, Login, Logout,checkSession,AddRoom,GetRooms} = require('../controller/authcontroller');
const { uploadImage, getRommById, getUserById, updateUser } = require('../controller/chatcontroller');
const isAuthenticated = require('../middleware/authMiddleware');
const { getUnreadNotifications } = require('../controller/profilecontroller');
// Routes
router.get('/', (req, res) => {
    res.send('API is running...');
});
const upload = multer(); // Initialize Multer without specifying storage if handling in memory



router.post('/register',registerUser);
router.post('/login',Login);
router.post('/logout',Logout);
router.get('/check-session',checkSession);
// Example API route to get rooms by user
router.get('/rooms',isAuthenticated,GetRooms);

router.post('/rooms',isAuthenticated,AddRoom);
router.get('/room/:roomId',isAuthenticated,getRommById);
router.post('/uploadImage', upload.single('file'), uploadImage);
router.get('/user/:userId',isAuthenticated,getUserById);
router.put('/user/:userId',isAuthenticated,updateUser);
router.get('/getnotifications',isAuthenticated,getUnreadNotifications);
module.exports = router;
