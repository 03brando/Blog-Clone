const fs = require("fs");

var posts = [];
var categories = [];

module.exports.initialize = (() => {
    return new Promise((resolve, reject) => {
        fs.readFile('./data/posts.json', 'utf-8', (err, data) => {
            if (err) reject("Unable to read file!");
            else {
                posts = JSON.parse(data);
                fs.readFile('./data/categories.json', 'utf-8', (err, data) => {
                    if (err) reject("Unable to read file!");
                    else {
                        categories = JSON.parse(data);
                        resolve();
                    }                    
                });
            }
        });
    });
});

module.exports.getAllPosts = (() => {
    return new Promise((resolve, reject) => {
        if (posts.length > 0) resolve(posts);
        else reject("No data found!");
    });
});

module.exports.getPublishedPosts = (() => {
    return new Promise((resolve, reject) => {
        var pubPosts = [];
        posts.forEach((i) => {
            if (i.published) pubPosts.push(i);
        });

        if (pubPosts.length > 0) resolve(pubPosts);
        else reject("No data found!"); 
    });
});

module.exports.getCategories = (() => {
    return new Promise((resolve, reject) => {
        if (categories.length > 0) resolve(categories);
        else reject("No data found!");
    });
});

module.exports.addPost = (postData) => {
    return new Promise((resolve, reject) => {
        if (postData.published){
            postData.published = true;
        }
        else{
            postData.published = false;
        }

        postData.id = posts.length + 1;
        //updates post date to current date
        postData.postDate = new Date().toISOString().slice(0, 10);
        posts.push(postData);
        resolve(posts[posts.length - 1]);
        reject("Post unsuccessful!")
    });
}

module.exports.getPostsByCategory = (category) => {
    return new Promise((resolve, reject) => {
        let selected = [];

        posts.forEach((i) => {
            if (i.category == category) selected.push(i);
        });

        if (selected.length > 0)resolve(selected);
        else reject("No results returned!")
    });
}

module.exports.getPostsByMinDate = (minDateStr) => {
    return new Promise((resolve, reject) => {
        let selected = [];

        posts.forEach((i) => {
            if (new Date(i.postDate) >= new Date(minDateStr)) selected.push(i);
        });

        if (selected.length > 0)resolve(selected);
        else reject("No results returned!")
    });
}

module.exports.getPostByID = (id) => {
    return new Promise((resolve, reject) => {
        let selected = {};

        posts.forEach((i) => {
            if (i.id == id) selected = i;
        });

        if (selected)resolve(selected);
        else reject("No results returned!")
    });
}

module.exports.getPublishedPostsByCategory = (category) => {
    return new Promise((resolve, reject) => {
        let selected = [];

        posts.forEach((i) => {
            if (i.category == category && i.published) selected.push(i);
        });

        if (selected.length > 0)resolve(selected);
        else reject("No results returned!")
    });
}