const logger = require('koa-logger');
const router = require('@koa/router')();
const koaBody = require('koa-body');
const mongoose = require("mongoose");
const Koa = require('koa');
const app = module.exports = new Koa();
require("./table.model");
const url = process.env.MONGO_URL || "mongodb://localhost:27017/tables"

const Table = mongoose.model("tables");
app.use(logger());
app.use(koaBody());


mongoose
  .connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connection established ");
  })
  .catch((err) => {
    console.log("Connection failed");
    console.log(err);
  });


// route definitions

router.get('/', health)
  .post('/create-table', createTable);
//.get('/list-table', listTables);


app.use(router.routes());

/**
 * health.
 */

async function health(ctx) {
  ctx.body = 'Up';
}

/**
 * Create a table.
 */

async function createTable(ctx) {
  const table = new Table(ctx.request.body);
  // const post = ctx.request.body;
  
  table.save()
  .then((data) => {
    if(data){
      ctx.body = data;
      console.log("table created")
    }else{
      console.log("table not  created")
      //ctx.throw(400);
    }
  })
  .catch((err) => {
    ctx.throw(400,'Error Message');
  });
  
}


app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    console.log('asdadasdas');
    // will only respond with JSON
    ctx.status = err.statusCode || err.status || 500;
    ctx.body = {
      message: err.message
    };
  }
})


// app.use(async ctx => {
//     ctx.body = 'Up';
// });
/*
app.use(async function(ctx, next) {
  try {
    await next();
  } catch (err) {
    console.log('said');
    // some errors will have .status
    // however this is not a guarantee
    ctx.status = err.status || 500;
    ctx.type = 'html';
    ctx.body = '<p>Something <em>exploded</em>, please contact Maru.</p>';

    // since we handled this manually we'll
    // want to delegate to the regular app
    // level error handling as well so that
    // centralized still functions correctly.
    ctx.app.emit('error', err, ctx);
  }
});


app.on('error', function(err) {
  console.log('err');
  if (process.env.NODE_ENV != 'test') {
    console.log('sent error %s to the cloud', err.message);
    console.log(err);
  }
});
*/
app.listen(3000);