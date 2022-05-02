var express = require("express");
var app = express();
const path = require('path')
const blog = require("./blog-service.js");
const multer = require("multer");
const cloudinary = require('cloudinary').v2
const streamifier = require('streamifier')
const upload = multer(); 
const exphbs = require('express-handlebars');
const stripJs = require('strip-js');
const blogData = require("./blog-service");
const authData = require("./auth-service");
const clientSessions = require("client-sessions");

cloudinary.config({
    cloud_name: "dzjtcux4l",
    api_key: "713113615991672",
    api_secret: "PxjnNwhZOkiQS0e8ZIOiT6eOFvk",
    secure: true
});

// handle bars 
app.engine('.hbs', exphbs.engine({
    extname: '.hbs',
    defaultLayout: 'main',
    helpers: {
        navLink: function (url, options) {
            return '<li' +
                ((url == app.locals.activeRoute) ? ' class="active" ' : '') +
                '><a href="' + url + '">' + options.fn(this) + '</a></li>';
        },
        equal: function (lvalue, rvalue, options) {
            if (arguments.length < 3)
                throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        },
        safeHTML: function (context) {
            return stripJs(context);
        },
        formatDate: function(dateObj){
            let year = dateObj.getFullYear();
            let month = (dateObj.getMonth() + 1).toString();
            let day = dateObj.getDate().toString();
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2,'0')}`;
        }        
    }
}));
app.set('view engine', '.hbs');

var HTTP_PORT = process.env.PORT || 8080;

const onHttpStart = () => console.log(`HTTP server is listening on port ${HTTP_PORT}`)

app.use(express.urlencoded({extended: true}));

app.use(express.static('public')); 

app.use(clientSessions({
    cookieName: "session", // this is the object name that will be added to 'req'
    secret: "week10example_web322", // this should be a long un-guessable string.
    duration: 2 * 60 * 1000, // duration of the session in milliseconds (2 minutes)
    activeDuration: 1000 * 60 // the session will be extended by this many ms each request (1 minute)
}));

app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});

const ensureLogin = (req, res, next) => {
    if (!req.session.user) {
        res.redirect("/login");
    } else {
        next();
    }
}

app.use(function(req,res,next){
    let route = req.path.substring(1);
    app.locals.activeRoute = (route == "/") ? "/" : "/" + route.replace(/\/(.*)/, "");
    app.locals.viewingCategory = req.query.category;
    next();
});

app.get("/", (req, res) => {
    res.redirect("/blog");
});

app.get('/about', (req, res) => {
    res.render('about', {
        data: null,
        layout: "main"
    })
})

app.get('/blog', async (req, res) => {

    // Declare an object to store properties for the view
    let viewData = {};

    try{

        // declare empty array to hold "post" objects
        let posts = [];

        // if there's a "category" query, filter the returned posts by category
        if(req.query.category){
            // Obtain the published "posts" by category
            posts = await blogData.getPublishedPostsByCategory(req.query.category);
        }else{
            // Obtain the published "posts"
            posts = await blogData.getPublishedPosts();
        }

        // sort the published posts by postDate
        posts.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));

        // get the latest post from the front of the list (element 0)
        let post = posts[0]; 

        // store the "posts" and "post" data in the viewData object (to be passed to the view)
        viewData.posts = posts;
        viewData.post = post;

    }catch(err){
        viewData.message = "no results";
    }

    try{
        // Obtain the full list of "categories"
        let categories = await blogData.getCategories();

        // store the "categories" data in the viewData object (to be passed to the view)
        viewData.categories = categories;
    }catch(err){
        viewData.categoriesMessage = "no results"
    }

    // render the "blog" view with all of the data (viewData)
    res.render("blog", {data: viewData})

});

app.get('/blog/:id', async (req, res) => {

    // Declare an object to store properties for the view
    let viewData = {};

    try {
        // declare empty array to hold "post" objects
        let posts = [];

        // if there's a "category" query, filter the returned posts by category
        if (req.query.category) {
            // Obtain the published "posts" by category
            posts = await blogData.getPublishedPostsByCategory(req.query.category);
        } else {
            // Obtain the published "posts"
            posts = await blogData.getPublishedPosts();
        }

        // sort the published posts by postDate
        posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

        // store the "posts" data in the viewData object (to be passed to the view)
        viewData.posts = posts;
    } catch (err) {
        viewData.message = "no results"; 
    }

    try {
        // Obtain the post by "id" 
        viewData.post = await blogData.getPostByID(req.params.id);
    } catch (err) {
        viewData.message = "no results";
    }

    try {
        // Obtain the full list of "categories"
        let categories = await blogData.getCategories();

        // store the "categories" data in the viewData object (to be passed to the view)
        viewData.categories = categories;
    } catch (err) {
        viewData.categoriesMessage = "no results";
    }

    // render the "blog" view with all of the data (viewData)
    res.render("blog", { data: viewData });
});

app.get("/posts", ensureLogin, (req, res) => {
    if (req.query.category) {
        blog.getPostsByCategory(req.query.category).then((selected) => {
            if (selected.length > 0){
                res.render("posts", {
                    posts: selected
                });
            }
            else{
                res.render("posts",{ message: "no results" });
            }    
        }).catch((err) => {
            res.render("posts", { message: "no results" });
        });
    } else if (req.query.minDate) {
        blog.getPostsByMinDate(req.query.minDate).then((selected) => {
            if (selected.length > 0){
                res.render("posts", {
                    posts: selected
                });
            }
            else{
                res.render("posts",{ message: "no results" });
            } 
        }).catch((err) => {
            res.render("posts", { message: "no results" });
        });
    } else {
        blog.getAllPosts().then((selected) => {
            if (selected.length > 0){
                res.render("posts", {
                    posts: selected
                });
            }
            else{
                res.render("posts",{ message: "no results" });
            } 
        }).catch((err) => {
            res.render("posts", { message: "no results" });
        });
    }        
});

app.get("/post/:id", ensureLogin, (req, res) => {
    blog.getPostByID(req.params.id).then((selected) => {
        res.json(selected);
    }).catch((err) => {
        res.json({ message: "no results" });
    });
});

app.get("/categories", ensureLogin, (req, res) => {
    blog.getCategories().then((categories) => {
        if (categories.length > 0){
            res.render("categories", {
                categories: categories
            });
        }
        else{
            res.render("categories",{ message: "no results" });
        } 
    }).catch((err) => {
        res.render("categories", { message: "no results" });
    });
});

app.get('/posts/add', ensureLogin, (req, res) => {
    blogData.getCategories().then((data) => {
        res.render("addPost", {
            categories: data
        });
    }).catch((err) => {
        res.render("addPost", {
            categories: []
        });
    });
})

//app.use(upload.single("featureImage"));

app.post("/posts/add", ensureLogin, upload.single("featureImage"), (req,res) => {
    if (req.file) {
        let streamUpload = (req) => {
            return new Promise((resolve, reject) => {
                let stream = cloudinary.uploader.upload_stream(
                    (error, result) => {
                        if (result) {
                            resolve(result);
                        } else {
                            reject(error);
                        }
                    }
                );
                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
        };

        async function upload(req) {
            let result = await streamUpload(req);
            console.log(result);
            return result;
        };

        upload(req).then((uploaded)=>{
            req.body.featureImage = uploaded.url;
            blog.addPost(req.body).then((data) => {
                res.redirect('/posts')
            }).catch((error) => {
                res.status(500).send(error)
            })
        });

    } else {
        req.body.featureImage = "";
            blog.addPost(req.body).then((data) => {
                res.redirect('/posts')
            }).catch((error) => {
                res.status(500).send(error)
            })
    }
})

app.get("/posts/delete/:id", ensureLogin, (req, res) => {
    blogData.deletePostById(req.params.id).then((data) => {
        res.redirect("/posts");
    }).catch((err) => {
        console.log(err);
        res.status(500).send("Unable to Remove Post / Post not found");
    });
});

app.post("/categories/add", ensureLogin, (req, res) => {
    blogData.addCategory(req.body).then(() => {
        res.redirect("/categories");
    }).catch((err) => {
        res.send(err);
    });
});

app.get("/categories/add", ensureLogin, (req, res) => {
    res.render('addCategory', {
        data: null,
        layout: "main"
    })
});

app.get("/categories/delete/:id", ensureLogin, (req, res) => {
    blogData.deleteCategoryById(req.params.id).then((data) => {
        res.redirect("/categories");
    }).catch((err) => {
        console.log(err);
        res.status(500).send("Unable to Remove Category / Category not found");
    });
});

app.post("/login", (req, res) => {
    req.body.userAgent = req.get("User-Agent");
    authData.checkUser(req.body).then((user) => {
        req.session.user = {
            username: user.username, 
            email: user.email, 
            loginHistory: user.loginHistory 
        }
        res.redirect("/posts");
    }).catch((err) => {
        res.render("login", {
            errorMessage: err,
            username: req.body.username
        });
    });
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/register", (req,res) => {
    authData.registerUser(req.body)
    .then(() => res.render("register", {successMessage: "User created" } ))
    .catch (err => res.render("register", {errorMessage: err, userName:req.body.userName }) )
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.get("/logout", (req, res) => {
    req.session.reset();
    res.redirect("/");
});

app.get("/userHistory", ensureLogin, (req, res) => {
    res.render("userHistory");
});

app.use((req, res) => {
    res.status(404).render('404page', {
        data: null,
        layout: "main"
    })
});

blogData.initialize()
.then(authData.initialize)
.then(function(){
    app.listen(HTTP_PORT, function(){
        console.log("app listening on: " + HTTP_PORT)
    });
}).catch(function(err){
    console.log("unable to start server: " + err);
});

