const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);



var tableSchema = mongoose.Schema({
  _id: Number,
  description: { type: String, required: false }
  
}, { _id: false });


tableSchema.post('save', function (error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    next(new Error('Duplicate key error occured'));
  } else {
    next(error);
  }
});
tableSchema.plugin(AutoIncrement);

mongoose.model('tables', tableSchema);



/*
mongoose.model('tables',{
    tableId: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true 
    }
})
*/
