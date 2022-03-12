const mongoose = require('mongoose');

mongoose.model('tables',{
    tableId: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true 
    }
})
