const Sequelize = require('sequelize');

var sequelize = new Sequelize('d8iq1vjb8cvbnh', 'pscyzfuuwzhxqi', 'c654fe961d32dbd3b0a8ba55c72d37d229f54698ef505ca99ee3ad484a5f134b', {
    host: 'ec2-54-160-109-68.compute-1.amazonaws.com',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false }
    },
    query: { raw: true }
});

//data models
let Post = sequelize.define("Post", {
    body: Sequelize.TEXT,
    title: Sequelize.STRING,
    postDate: Sequelize.DATE,
    featureImage: Sequelize.STRING,
    published: Sequelize.BOOLEAN
}, {
    createdAt: false, 
    updatedAt: false 
});

let Category = sequelize.define("Category", {
    category: Sequelize.STRING
}, {
    createdAt: false, 
    updatedAt: false 
});

Post.belongsTo(Category, {foreignKey: 'category'});

module.exports.initialize = (() => {
    return new Promise((resolve, reject) => {
        sequelize.sync().then(() => {
            resolve();
        }).catch((err) => {
            reject(`Unable to sync database. ${err}`);
        });
    });
});

module.exports.getAllPosts = (() => {
    return new Promise((resolve, reject) => {
        Post.findAll().then((data) => {
            if (data.length > 0) {
                resolve(data);
            } else {
                reject("No results returned.");
            }
        }).catch((err) => {
            reject(err);
        });
    });
});

module.exports.getPublishedPosts = (() => {
    return new Promise((resolve, reject) => {
        Post.findAll({
            where: {
                published: true
            }
        }).then((selected) => {
            if (selected.length > 0) {
                resolve(selected);
            } else {
                reject("No results returned.");
            }
        }).catch((err) => {
            reject(err);
        });
    });
});

module.exports.getCategories = (() => {
    return new Promise((resolve, reject) => {
        Category.findAll().then((data) => {
            if (data.length > 0) {
                resolve(data);
            } else {
                reject("No results returned.");
            }
        }).catch((err) => {
            reject(err);
        });
    });
});

module.exports.addPost = (postData) => {
    return new Promise((resolve, reject) => {
        postData.published = (postData.published) ? true : false;
        postData.postDate = new Date();

        for (const i in postData) {
            if (postData[i] == "") postData[i] = null;
        }

        Post.create({
            body: postData.body,
            title: postData.title,
            postDate: postData.postDate,
            featureImage: postData.featureImage,
            published: postData.published,
            category: postData.category
        }).then((newPost) => {
            resolve(newPost);
        }).catch((err) => {
            console.log("Unable to create post.");
        });
    });
}

module.exports.deletePostById = (id) => {
    return new Promise((resolve, reject) => {
        Post.destroy({
            where: {
                id: id
            } 
        }).then(() =>{
            resolve();
        }).catch((err) => {
            reject("Cannot delete post.");
        })
    });
}

module.exports.addCategory = (categoryData) => {
    return new Promise((resolve, reject) => {
        for (const i in categoryData) {
            if (categoryData[i] == "") categoryData[i] = null;
        }

        Category.create({
            category: categoryData.category
        }).then((newCat) => {
            resolve(newCat);
        }).catch((err) => {
            console.log("Unable to create category.");
        });

    });
}

module.exports.deleteCategoryById = (id) => {
    return new Promise((resolve, reject) => {
        Category.destroy({
            where: {
                id: id
            } 
        }).then(() =>{
            resolve();
        }).catch((err) => {
            reject("Cannot delete category.");
        })
    });
}

module.exports.getPostsByCategory = (category) => {
    return new Promise((resolve, reject) => {
        Post.findAll({
            where: {
                category: category
            }
        }).then((selected) => {
            if (selected.length > 0) {
                resolve(selected);
            } else {
                reject("No results returned.");
            }
        }).catch((err) => {
            reject(err);
        });
    });
}

module.exports.getPostsByMinDate = (minDateStr) => {
    return new Promise((resolve, reject) => {
        const Op = Sequelize.Op;

        Post.findAll({
            where: {
                postDate: {
                    [Op.gte]: new Date(minDateStr)
                }
            }
        }).then((selected) => {
            if (selected.length > 0) {
                resolve(selected);
            } else {
                reject("No results returned.");
            } 
        }).catch((err) => {
            reject(err);
        });
    });
}

module.exports.getPostByID = (id) => {
    return new Promise((resolve, reject) => {
        Post.findAll({
            where: {
                id: id
            }
        }).then((selected) => {
            if (selected.length > 0) {
                resolve(selected[0]);
            } else {
                reject("No results returned.");
            }
        }).catch((err) => {
            reject(err);
        });
    });
}

module.exports.getPublishedPostsByCategory = (category) => {
    return new Promise((resolve, reject) => {
        Post.findAll({
            where: {
                category: category,
                published: true
            }
        }).then((selected) => {
            if (selected.length > 0) {
                resolve(selected);
            } else {
                reject("No results returned.");
            }
        }).catch((err) => {
            reject(err);
        });
    });
}

