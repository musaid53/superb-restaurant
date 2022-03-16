const mongoose = require('mongoose');


var timeSchema = mongoose.Schema({
  hour: {type: Number, required: true},
  minute: {type: Number, required: true},
});
var configSchema = mongoose.Schema({
  day: {type: String, required: true},
  timezone: {type: Number, required: true},
  startTime: timeSchema,
  endTime: timeSchema
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
