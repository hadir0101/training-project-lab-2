const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');

const app = express();


app.set('view engine', 'ejs');
app.use(express.static('public'));
// app.use(express.static('assets'));
app.use('/assets', express.static('assets'));




app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: 'your-secret-key',
  resave: true,
  saveUninitialized: true
}));

// MongoDB Connection Retry Function
function connectWithRetry() {
  return mongoose.connect('mongodb://127.0.0.1:27017/blog', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
      console.log('MongoDB connected successfully');
    })
    .catch((err) => {
      console.error('MongoDB connection error:', err.message);
      console.log('Retrying MongoDB connection in 5 seconds...');
      setTimeout(connectWithRetry, 5000);
    });
};

// Connect to MongoDB
connectWithRetry();

// User Schema and Model
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String
});

userSchema.index({ username: 1 });

const User = mongoose.model('User', userSchema);

// Comment Schema and Model
const commentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String,
  email: String,
  website: String,
  message: String,
  content: String
});

const Comment = mongoose.model('Comment', commentSchema);



// Set EJS as the View Engine
app.set('view engine', 'ejs');
app.use(express.static('public'));

// Debugging middleware to log incoming requests
app.use((req, res, next) => {
  console.log(`Received ${req.method} request for ${req.url}`);
  next();
});

// Retry Function to Handle MongoDB Operations
const retry = async (operation, maxRetries, delay) => {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      const result = await operation();
      return result;
    } catch (error) {
      retries++;
      if (retries === maxRetries) {
        throw error;
      } else {
        await new Promise((res) => setTimeout(res, delay));
      }
    }
  }
};

// Routes
app.get('/', async (req, res) => {
  try {
    if (req.session.userId) {
      const comments = await Comment.find({}).populate('author');
      const user = await User.findById(req.session.userId);
      res.render('index', { comments, user }); // Change 'home' to 'index'
    } else {
      res.redirect('/login');
    }
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.redirect('/login');
  }
});


app.get('/login', (req, res) => {
  res.render('login');
});






app.post('/login', async (req, res) => {
  try {
    console.log('Login route accessed');
    const { username, password } = req.body;

    const findUserOperation = () => User.findOne({ username });
    const user = await retry(findUserOperation, 3, 1000);

    let errorMessage = ''; // Initialize errorMessage

    if (user && bcrypt.compareSync(password, user.password)) {
      req.session.userId = user._id;
      res.redirect('/index'); // Change the redirect path to '/index'
    } else {
      console.log('Invalid username or password');
      errorMessage = 'Invalid username or password'; // Set errorMessage
      res.render('login', { errorMessage });
    }
  } catch (error) {
    console.error('Error during login:', error.message);
    errorMessage = 'An error occurred during login'; // Set errorMessage
    res.render('login', { errorMessage });
  }
});



app.get('/home', async (req, res) => {
  try {
    if (req.session.userId) {
      const user = await User.findById(req.session.userId);
      const comments = await Comment.find({}).populate('author');
      res.render('home', { user, comments });
    } else {
      res.redirect('/login');
    }
  } catch (err) {
    console.error('Error fetching data:', err);
    res.redirect('/home');
  }
});


app.get('/signup', (req, res) => {
  res.render('signup', { errorMessage: null });
});

app.post('/signup', async (req, res) => {
  const { username, password } = req.body;

  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = new User({ username, password: hashedPassword });

    await newUser.save();
    req.session.userId = newUser._id;
    res.redirect('/');
  } catch (err) {
    if (err.code === 11000) {
      // Duplicate key error (username already exists)
      console.log('Username already exists. Choose a different username.');
      res.render('signup', { errorMessage: 'Username already exists. Choose a different username.' });
    } else {
      console.error('Error during signup:', err.message);
      res.redirect('/signup');
    }
  }
});



app.get('/index', async (req, res) => {
  try {
    if (req.session.userId) {
      const comments = await Comment.find({}).populate('author');
      const user = await User.findById(req.session.userId);
      res.render('index', { comments, user });
    } else {
      res.redirect('/login');
    }
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.redirect('/login');
  }
});





app.post('/comment', async (req, res) => {
  const { name, email, website, message} = req.body;

  try {
    if (req.session.userId) {
      const newComment = new Comment({
        author: req.session.userId,
        name,
        email,
        website,
        message,
        // content
      });
      await newComment.save();
    }
    res.redirect('/');
  } catch (err) {
    console.error('Error submitting comment:', err.message);
    res.redirect('/');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error during logout:', err.message);
    } else {
      res.redirect('/login');
    }
  });
});

// Server Listening
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});



