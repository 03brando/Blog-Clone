/*********************************************************************************
*  WEB322 – Assignment 04
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: Brandon Kandola Student ID: 112461165 Date: March 11 2022
*
*  Online (Heroku) URL: 
*
*  GitHub Repository URL: https://github.com/03brando/web322-app
*
********************************************************************************/ 

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
        }
    }
}));
app.set('view engine', '.hbs');

var HTTP_PORT = process.env.PORT || 8080;

const onHttpStart = () => console.log(`HTTP server is listening on port ${HTTP_PORT}`)

app.use(express.static('public')); 

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

app.get("/posts", (req, res) => {
    if (req.query.category) {
        blog.getPostsByCategory(req.query.category).then((selected) => {
            res.render("posts", {
                posts: selected
            });
        }).catch((err) => {
            res.render("posts", { message: "no results" });
        });
    } else if (req.query.minDate) {
        blog.getPostsByMinDate(req.query.minDate).then((selected) => {
            res.render("posts", {
                posts: selected
            });
        }).catch((err) => {
            res.render("posts", { message: "no results" });
        });
    } else {
        blog.getAllPosts().then((posts) => {
            res.render("posts", {
                posts: posts
            });
        }).catch((err) => {
            res.render("posts", { message: "no results" });
        });
    }        
});

app.get("/post/:id", (req, res) => {
    blog.getPostByID(req.params.id).then((selected) => {
        res.json(selected);
    }).catch((err) => {
        res.json({ message: "no results" });
    });
});

app.get("/categories", (req, res) => {
    blog.getCategories().then((categories) => {
        res.render("categories", { categories: categories });
    }).catch((err) => {
        res.render("categories", { message: "no results" });
    });
});

app.get('/posts/add', (req, res) => {
    res.render('addPost', {
        data: null,
        layout: "main"
    })
})

app.use(upload.single("featureImage"));

app.post('/posts/add', (req, res) => {
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
    }
  
    upload(req).then((uploaded)=>{
        req.body.featureImage = uploaded.url;
        blog.addPost(req.body).then((data) => {
            res.redirect('/posts')
        }).catch((error) => {
            res.status(500).send(error)
        })
    });
})

app.use((req, res) => {
    res.status(404).render('404page', {
        data: null,
        layout: "main"
    })
});

blog.initialize().then(() => {
    app.listen(HTTP_PORT, onHttpStart);
}).catch((err) => {
    console.log(err);
});

