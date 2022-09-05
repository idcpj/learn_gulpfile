const { src, dest, series, watch,task } = require('gulp');

const connect = require('gulp-connect');

// tools
const rename = require('gulp-rename');
const rev = require('gulp-rev'); //对文件名加MD5后缀
const revCollector = require('gulp-rev-collector'); //路径替换
const clean = require('gulp-clean');
const fileinclude = require('gulp-file-include');//  使用@@include 的方式引入 文件
var preprocess = require("gulp-preprocess");


// js
const uglify = require('gulp-uglify');
const babel=require("gulp-babel");

// html
const htmlmin = require('gulp-htmlmin');
const revappend = require('gulp-rev-append');  //使用文件hash

// css
const minifyCSS = require('gulp-minify-css');
const sass = require('gulp-sass')(require('sass'));
const autoprefixer = require('gulp-autoprefixer');

// img
const imagemin = require('gulp-imagemin');


const entry = "src/" //要处理的源码文件夹
const dist = 'dist/'; //被处理后的文件保存的目录

//清除文件夹里之前的内容
function cleanBefore() {
    return src(dist, { read: false,allowEmpty: true })
        .pipe(clean());
}

//html压缩
function handleHtml() {
    var options = {
        removeComments: true, //清除HTML注释
        collapseWhitespace: true, //压缩HTML
        collapseBooleanAttributes: true, //省略布尔属性的值 <input checked="true"/> ==> <input />
        removeEmptyAttributes: true, //删除所有空格作属性值 <input id="" />
        minifyJS: true, //压缩页面JS
        minifyCSS: true //压缩页面CSS
    };
    return src(entry + '**/*.html')
        // .pipe(htmlmin(options))
        .pipe(preprocess({context:{NODE_ENV:"production",DEFINE1:"select_1"}})) // 相当于 C/C++ 中的宏定义
        .pipe(fileinclude({
            prefix: '@@',
            basepath: '@file'
        }))
        .pipe(dest(dist));
}


//css压缩,将源码文件夹内的css文件夹下的所有css压缩，并生成文件名带hash随机值的新文件保存在dist的css目录下
function handleCss() {
    return src(entry + 'css/*.scss')
        .pipe(sass())
        .pipe(autoprefixer({cascade: false}))
        // .pipe(minifyCSS()) //压缩css
        .pipe(rev()) //文件名加MD5后缀
        .pipe(dest(dist+'css/')) //输出到css目录
        .pipe(rev.manifest('rev-css-manifest.json')) ////生成一个rev-css-manifest.json
        .pipe(dest('rev')); //将 rev-css-manifest.json 保存到 rev 目录内
}

//js压缩,将源码文件夹src内的js文件夹下的所有js文件压缩混淆，并生成文件名带hash随机值的新文件保存在dist的js目录下

function handleJs() {
    return src(entry + 'js/*.js')
        .pipe(babel({
            presets: ['@babel/preset-env']
        }))
        // .pipe(uglify({
        //     compress: {
        //         // drop_console: argv.env != 'development'?true:false,  // 过滤 console
        //         // drop_debugger: argv.env != 'development'?true:false // 过滤 debugger
        //         drop_console:false,  // 过滤 console
        //         drop_debugger:true // 过滤 debugger
        //     }
        // }) //压缩js到一行
        .pipe(rev()) //文件名加MD5后缀
        .pipe(dest(dist+'js/')) //输出到js目录
        .pipe(rev.manifest()) ////生成一个rev-js-manifest.json
        .pipe(dest('rev')); //将 rev-js-manifest.json 保存到 rev 目录内
}

//打包图片
function handleImgs() {
    return src(entry + 'img/**/*')
        .pipe(rev())
        // .pipe(imagemin([
        //     imagemin.gifsicle({interlaced: true}),
        //     imagemin.mozjpeg({quality: 75, progressive: true}),
        //     imagemin.optipng({optimizationLevel: 5}),
        //     imagemin.svgo({
        //         plugins: [
        //             {removeViewBox: true},
        //             {cleanupIDs: false}
        //         ]
        //     })
        // ]))
        .pipe(dest(dist + 'img/'))
        .pipe(rev.manifest('rev-img-manifest.json')) //生成一个rev-img-manifest.json
        .pipe(dest('rev')); //将 rev-img-manifest.json 保存到 rev 目录内;
}


//使用rev-collect将在html引入的资源路径也替换成md5文件名
function srcReplace() {
    //html，针对js,css,img
    return src(['rev/*.json', dist+'*.html'])
        .pipe(revCollector({replaceReved:true }))
        .pipe(dest(dist));
}


task("change",()=>{

    connect.server({
        root: 'dist',
        host: '127.0.0.1',
        livereload: true,
        port: 8888,
    });
    const watcher = watch([ "src/**/*"]);
    watcher.on(
        "change",
        series(cleanBefore,handleCss, handleHtml, handleJs, handleImgs,srcReplace)

    )
})


exports.default =     series(cleanBefore,handleCss, handleHtml, handleJs, handleImgs,srcReplace); //组合任务
