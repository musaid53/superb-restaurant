require('../models/table.model');
const dbConnection  = require('./DbConnection');
const mongoose = require("mongoose");
const Table = mongoose.model('tables');

class TableService {

    constructor() {
        this.db = dbConnection;
        this.model = Table;
    }

    async create(request) {
        return await new Table(request).save();
    }
    //todo delete all reservations related to this table
    async deleteAll() {
        return await Table.deleteMany({});
    }
    
    async listAll() {
        return await Table.find();
    }
    async findById(id) {
        return await Table.findById(id);
    }
    async deleteById(id) {
        return await Table.deleteOne({_id: id })
    }


};

module.exports = new TableService();