const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    }
});

// .plugin adds username, password to UserSchema model
// also it checks that username is unique and creates salt and hashes passwords

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);