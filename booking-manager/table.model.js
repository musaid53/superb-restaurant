const mongoose = require('mongoose');

var tableSchema = mongoose.Schema({
    _id: {type: String, required: true}
    // seq: { type: Number, default: 0 }
});


tableSchema.post('save', function(error, doc, next) {
    if (error.name === 'MongoError' && error.code === 11000) {
      //next(new Error('There was a duplicate key error'));
        console.error('There was a duplicate key error');
    } else {
      next(error);
    }
  });

mongoose.model('tables', tableSchema);



/*
mongoose.model('tables',{
    tableId: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true 
    }
})
*/
