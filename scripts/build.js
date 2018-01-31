'use strict';

const browserify = require('browserify');
const watchify = require('watchify');
const tsify = require('tsify');
const fs = require('fs-extra');
const less = require('less');
const gaze = require('gaze');


const check_arg = arg => process.argv.some(x => x == arg);

const shouldLog = !check_arg('-s');
const shouldWatch = check_arg('-w');
const mode = !!check_arg('--lib') ? 'lib' : 'dev';
const log = shouldLog ? console.log : () => {};

function delayed(callback) {
    var t = 0;
    return function() {
        clearTimeout(t);
        setTimeout(callback.bind(this, arguments), 100);
    }
}

function timer() {
    let n = process.hrtime();
    return {
        get: function() {
            const end = process.hrtime(n);
            return `${Math.round((end[0] * 1000) + (end[1] / 1000000))}ms`;
        }

    };
}

function run(tasks) {

    tasks.clean();

    if (shouldWatch) {
        console.log('Building & watching...');
        
        tasks.js();
        tasks.css();
        tasks.resources();

        gaze('./src/**/*.less', function(err, watch) {
            this.on('all', delayed(tasks.css));
        });

        gaze('./res/**/*', function(err, watch) {
            this.on('all', delayed(tasks.resources));
        });
    }
    else {
        log('Building...');
        tasks.js();
        tasks.css();
        tasks.resources();
    }
}

/**
 * Dev tasks
 */
const devTasks = {
    /**
     * Clean
     */
    clean: () => {
        log('Cleaning...');

        fs.ensureDirSync('./dist/dev');
        fs.emptyDirSync('./dist/dev');        
    },
    /**
     * Prepare CSS
     */
    css: () => {
        const code = fs.readFileSync('./src/main.less').toString();
        const opts = { filename: './src/main.less' }
        const time = timer();
        less.render(code, opts)
            .then(function(output) {
                fs.writeFileSync('./dist/dev/main.css', output.css);
                log('-> css built at', new Date(), 'in', time.get());
            },
            function(error) {
                console.log('Less Error: ' + error.message);
            }); 
    },
    /**
     * Prepare JS
     */
    js: () => {        
        
        const time = timer();
        const b = browserify({
            entries: ['./src/main.tsx'],
            debug: true,
            cache: {},
            packageCache: {},
            plugin: [tsify]
        });

        if (shouldWatch) {
            b.plugin(watchify, { delay: 1000 });
        }

        b.on('update', bundle);
        
        function bundle() {
            b.bundle()
             .on('end', () => log('-> scripts built at', new Date(), 'in', time.get()))
             .on('error', e => console.error(e.toString()))
             .pipe(fs.createWriteStream('./dist/dev/main.js'));
        }

        bundle();
    },
    /**
     * Prepare resources
     */
    resources: () => {
        const time = timer();
        fs.copySync('./res', './dist/dev');
        log('-> resources built at', new Date(), 'in', time.get());
    }
}

/**
 * Lib tasks
 */
const libTasks = {
    /**
     * Clean
     */
    clean: () => {
        log('Cleaning...');
        
        fs.ensureDirSync('./dist/lib');
        fs.emptyDirSync('./dist/lib'); 
    },
    /**
     * Prepare CSS
     */
    css: () => {
        log('-> less...');
        const code = fs.readFileSync('./src/index.less').toString();
        const opts = { filename: './src/index.less' }
        less.render(code, opts)
            .then(function(output) {
                fs.writeFileSync('./dist/lib/index.css', output.css);
                log('-> css built.');
            },
            function(error) {
                console.log('Less Error: ' + error.message);
            }); 
    },
    /**
     * Prepare JS
     */
    js: () => {
        log('-> scripts ignored in lib mode...');
    },
    /**
     * Prepare resources
     */
    resources: () => {
        fs.copySync('./res', './dist/lib/res');
        //Remove index.html; its dev only
        fs.removeSync('./dist/lib/res/index.html');
        log('-> resources built.');
    }
}

switch (mode) {
    case 'lib':
        run(libTasks);
        break;
    case 'dev':
        run(devTasks);
        break;
    default:
        throw 'Invalid mode: ' + mode;
}
