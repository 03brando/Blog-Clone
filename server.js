/*********************************************************************************
*  WEB322 – Assignment 04
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: Brandon Kandola Student ID: 112461165 Date: march 11 2022
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
const upload = multer(); // no { storage: storage } since we are not using disk storage

cloudinary.config({
    cloud_name: "dzjtcux4l",
    api_key: "713113615991672",
    api_secret: "PxjnNwhZOkiQS0e8ZIOiT6eOFvk",
    secure: true
});

var HTTP_PORT = process.env.PORT || 8080;

const onHttpStart = () => console.log(`HTTP server is listening on port ${HTTP_PORT}`)

app.use(express.static('public')); 

app.get('/', (req, res) => {
    res.redirect('/about')
})

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, '/views/about.html'))
})

app.get("/blog", (req, res) => {
    blog.getPublishedPosts().then((pubPosts) => {
        res.json(pubPosts);
    }).catch((err) => {
        res.json({ message: err });
    });
});

app.get("/posts", (req, res) => {
    if (req.query.category) {
        blog.getPostsByCategory(req.query.category).then((selected) => {
            res.json(selected);
        }).catch((err) => {
            res.json({ message: err });
        });
    } else if (req.query.minDate) {
        blog.getPostsByMinDate(req.query.minDate).then((selected) => {
            res.json(selected);
        }).catch((err) => {
            res.json({ message: err });
        });
    } else {
        blog.getAllPosts().then((posts) => {
            res.json(posts);
        }).catch((err) => {
            res.json({ message: err });
        });
    }        
});

app.get("/post/:id", (req, res) => {
    blog.getPostByID(req.params.id).then((selected) => {
        res.json(selected);
    }).catch((err) => {
        res.json({ message: err });
    });
});

app.get("/categories", (req, res) => {
    blog.getCategories().then((categories) => {
        res.json(categories);
    }).catch((err) => {
        res.json({ message: err });
    });
});

app.get('/posts/add', (req, res) => {
    res.sendFile(path.join(__dirname, '/views/addPost.html'))
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
    res.status(404).sendFile(path.join(__dirname, '/views/404page.html'))
});

blog.initialize().then(() => {
    app.listen(HTTP_PORT, onHttpStart);
}).catch((err) => {
    console.log(err);
});