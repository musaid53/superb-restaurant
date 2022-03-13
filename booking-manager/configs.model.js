const mongoose = require('mongoose');



var configSchema = mongoose.Schema({
  entries: {
    type: Map,
    of: String
  }
});


configSchema.post('save', function (error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    next(new Error('Duplicate key error occured'));
  } else {
    next(error);
  }
});

mongoose.model('configs', configSchema);



/*
mongoose.model('tables',{
    tableId: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true 
    }
})
*/
