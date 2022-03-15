const mongoose = require('mongoose');

// todo; auto increment
var reservationSchema = mongoose.Schema({
    tableId: {type: Number, required: true},
    peopleCount: {type: Number,  default: 1},
    startDate : {type: Date, required: true},
    endDate: {type: Date, required: true}
});


reservationSchema.post('save', function(error, doc, next) {
    if (error.name === 'MongoError' && error.code === 11000) {
      next(new Error('Duplicate key error occured'));
    } else {
      next(error);
    }
  });

mongoose.model('reservations', reservationSchema);
