var mongoose = require("mongoose");
var bcrypt = require('bcryptjs');
var Schema = mongoose.Schema;

var userSchema = new Schema({
    "username": {
        type: String,
        unique: true
    },
    "email": String,
    "password": String,
    "loginHistory": [{
        "dateTime": Date,
        "userAgent": String
    }]
})

let User; 

module.exports.initialize = function () {
    return new Promise(function (resolve, reject) {
        let db = mongoose.createConnection("mongodb+srv://03brando:database123@senecaweb.qqxea.mongodb.net/web322-app?retryWrites=true&w=majority");
        db.on('error', (err)=>{
            reject(err); 
        });
        db.once('open', ()=>{
           User = db.model("users", userSchema);
           resolve();
        });
    });
};

module.exports.registerUser = function (userData) {
    return new Promise((resolve, reject) => {
        if (userData.password !== userData.password2)
            reject("Passwords do not match");

        bcrypt.hash(userData.password, 10).then(hash => {
            userData.password = hash;
            let newUser = new User(userData);
            newUser.save((err) => {
                if (err && err.code === 11000)
                    reject("User Name already taken");
                else if (err)
                    reject("There was an error creating the user: " + err);
                else
                    resolve();
            });
        }).catch(err=>{
            reject(err);
        });
    });
}

module.exports.checkUser = (userData) => {
    return new Promise((resolve, reject) => {
        User.find({
            username: userData.username
        }).exec().then((users) => {
            if (users.length == 0) {
                reject(`Unable to find user '${userData.username}'.`);
            } else {
                bcrypt.compare(userData.password, users[0].password).then((match) => {
                    if (match === false) {
                        reject("Incorrect Password!");
                    } else if (match === true) {
                        if (users[0].loginHistory == null) {
                            users[0].loginHistory = [];
                        }

                        users[0].loginHistory.push({
                            dateTime: (new Date()).toString(), userAgent: userData.userAgent
                        });
                        User.updateOne({
                            username: users[0].username
                        }, {
                            $set: {
                                loginHistory: users[0].loginHistory
                            }
                        }).exec().then(() => {
                            resolve(users[0]);
                        }).catch((err) => {
                            reject(err);
                        });
                    }
                });
            }
        }).catch(() => {
            reject("User not found!");
        });
    });
}