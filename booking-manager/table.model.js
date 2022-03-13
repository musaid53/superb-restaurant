const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);



var tableSchema = mongoose.Schema({
  description: { type: String, required: false }
  
});


tableSchema.post('save', function (error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    next(new Error('Duplicate key error occured'));
  } else {
    next(error);
  }
});
tableSchema.plugin(AutoIncrement, { inc_field: 'id' });

mongoose.model('tables', tableSchema);



/*
mongoose.model('tables',{
    tableId: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true 
    }
})
*/
