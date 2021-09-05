const jwt = require('jsonwebtoken')

const RequireAuth = (req,res,next) => {
  const token = req.cookies.jwt
  if(token) {
    jwt.verify(token,process.env.JWT_SECRET,(err,decodedToken)=>{
      if(err) {
        console.log(err.message)
        res.send({error : err.message})
      }else {
        next()
      }
    })
  } else {
    res.send({error:'Unauthorized'})
  }

}

module.exports = RequireAuth