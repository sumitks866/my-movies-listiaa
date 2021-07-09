require('dotenv').config() ;
const express = require('express') ;
const mongoose = require('mongoose') ;
var corsOptions = {
    origin: '*',
    credentials: true };
const cors = require('cors') ;
const app = express() ;

app.use(express.json()) ;
app.use(cors());

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

app.use('/users',userRouter);
app.use('/posts',postRouter) ;
app.use('/movies',movieRouter) ;


let port = process.env.PORT || 8000;
app.listen(port, () => console.log('server started')) ;