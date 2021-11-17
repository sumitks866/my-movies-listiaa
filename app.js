require('dotenv').config() ;
const express = require('express') ;
const mongoose = require('mongoose') ;
var corsOptions = {
    origin:"http://localhost:3000",
    credentials: true };
const cors = require('cors') ;
const cookieParser = require('cookie-parser')
const app = express() ;

app.use(express.json()) ;
app.use(cors(corsOptions));
app.use(cookieParser());

mongoose.connect(process.env.DB_URI, {useNewUrlParser:true, useUnifiedTopology:true}) ;
mongoose.set('useCreateIndex',true) ;
const con = mongoose.connection

con.on('error', console.error.bind(console, 'connection error:'));
con.once('open', ()=> {
  console.log("Connected to mongodb")
});

const userRouter = require('./routes/users');
const postRouter = require('./routes/posts');
const movieRouter = require('./routes/movies') ;

const api = require('./api/v2/user-movie-api');

app.use('/users',userRouter);
app.use('/posts',postRouter) ;
app.use('/movies',movieRouter) ;
app.use('/api/v2',api);

let port = process.env.PORT || 8000;
app.listen(port, () => console.log('server started')) ;