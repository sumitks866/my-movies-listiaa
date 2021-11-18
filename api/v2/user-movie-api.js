const express = require('express');
const router = express.Router();
const { Watch } = require('../../models/watch');
const { saveMovie } = require('../../core/movies/movie-controller');
const constants = require('../../constants/movie-list.constant');
const { authenticateUser } = require('../../utils/auth');
const  RequireAuth = require('../../middleware/authMiddleware');
const validator = require('../../utils/validator');
const { User} = require('./../../models/user');
const {updateMovieCount} = require('./../../core/user-controller')

/* 
  query parameters
    - username       string       required
    - watch_later    boolean      optional    default(false)
    - page_number    number       optional    default(1)
    - sort_key       number       optional    
*/
router.get('/fetch_movie_list', async(req, res) => {
  const username = req.query.username;
  const validateMsg = validator.validateUsername(username)
  if(validateMsg) {
    res.status(401).send(validateMsg);
    return;
  }

  let watchLater = false ;

  if(req.query.watch_later && req.query.watch_later === 'true') {
    watchLater = true;
  }

  const query = {
    username,
    watch_later: watchLater,
  }

  let pageNumber = 1;
  if(req.query.page_number) {
    pageNumber = parseInt(req.query.page_number) ;
  }

  var sortKey = {};
  if(req.query.sort_key && req.query.sort_key === 'score' ) {
    sortKey['score'] = -1;
  } else  {
    sortKey['_id'] = 1;
  }
  
  try {
    const result = await Watch.aggregate([
        { $match: query },
        { $sort : sortKey },
        { $skip : (pageNumber- 1) * constants.PAGE_SIZE },
        { $limit : constants.PAGE_SIZE },
        { $project: { 
                      "_id": 0,
                      "user_id": 0
                    }
        },
        { $lookup: {
                      from : 'movies',
                      localField: 'movie_id',
                      foreignField: 'movie_id',
                      as: 'movie_details'
                    }
        },
        {
          $unwind: '$movie_details'
        },
      ]);
    res.send(result);
  } catch(err) {
    console.log(err);
    res.status(401).send('fetch failed');
  }
})



router.post('/add_movie', RequireAuth, async (req, res) => {
  
  const user = await authenticateUser(req.cookies.jwt) ;
  const movieId = req.body.movie_id;
  const score = req.body.score;
  const review = req.body.review;

  let validateMsg = validator.validateMovieId(movieId)
  if(validateMsg) {
    res.status(401).send(validateMsg);
    return;
  }
  
  let watchLater = false ;
  if(req.body.watch_later && req.body.watch_later === true) {
    watchLater = true;
  }

  const obj = new Watch({
    username: user.username,
    movie_id: movieId,
    watch_later: watchLater,
  })

  if(!watchLater) {
    validateMsg = validator.validateScore(score);
    if(validateMsg) {
      res.status(401).send(validateMsg);
      return;
    } 
    validateMsg = validator.validateReview(review);
    if(validateMsg) {
      res.status(401).send(validateMsg);
      return;
    }
    obj.score = score;
    obj.review = review;
  }

  console.log(obj);

  try {
    const movie = await saveMovie(movieId);
    if(movie) {
      await obj.save();
      const list_type = watchLater ? 'watch_later_count' :'movies_count';
      await updateMovieCount(user.id, list_type, 1);
      res.send('updated successfully');
    } else {
      res.status(401).send('could not add movie');
    }
  } catch(err) {
    res.status(401).send('could not add movie');
  }
  res.end(); 
})

router.patch('/update_movie', RequireAuth, async (req, res) => {
  const user = await authenticateUser(req.cookies.jwt) ;
  const movieId = req.body.movie_id;
  let validateMsg = validator.validateMovieId(movieId);
  if(validateMsg) {
    res.status(401).send(validateMsg);
    return;
  }
  const obj = {};
  if(req.body.new_score)
    obj.score = req.body.new_score;
  if(req.body.new_review) 
    obj.review = req.body.new_review;
  if(req.body.watch_later === true) {
    obj.watch_later = true;
  }

  if(req.body.watch_later === false) {
    obj.watch_later = false;
    validateMsg = validator.validateScore(obj.score) ;
    if(validateMsg){
      res.status(401).send(validateMsg);
      return;
    }
    validateMsg = validator.validateReview(obj.review);
    if(validateMsg) {
      res.status(401).send(validateMsg);
      return;
    }
  }
  
  try {
    query = { movie_id: movieId, username: user.username };
    await Watch.updateMany(query, obj, {upsert: true, safe: true});
    res.send('updated successfully');
  } catch(e) {
    console.log(e);
    res.status(500).end();
  }
}) ; 

router.delete('/delete_movie', RequireAuth, async(req,res)=> {
  const user = await authenticateUser(req.cookies.jwt) ;
  const movieId = req.query.movie_id;
   
  const watchLater = req.query.watch_later === 'true';

  try {
    const query = {
      username: user.username,
      movie_id: movieId,
      watch_later: watchLater
    };
    await Watch.deleteOne(query);
    const list_type = watchLater ? 'watch_later_count' :'movies_count';
    await updateMovieCount(user.id, list_type, -1);
    res.send('deleted successfully');
  } catch(e) {
    res.status(500).send('deletion failed');
  }
}) 

module.exports = router;