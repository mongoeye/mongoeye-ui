/* eslint-env node */
/* eslint no-console: "off" */
import gulp from 'gulp';
import gulpif from 'gulp-if';
import fs from 'fs';
import path from 'path';
import through from 'through2';
import util from 'gulp-util';
import rename from 'gulp-rename';
import del from 'del';
import runSequence from 'run-sequence';
import eventStream from 'event-stream';
import streamqueue from 'streamqueue';
import mergejson from 'gulp-merge-json';
import bust from 'gulp-buster';
import plumber from 'gulp-plumber';
import size from 'gulp-size';
import filter from 'gulp-filter';
import sourcemaps from 'gulp-sourcemaps';
import eslint from 'gulp-eslint';
import concat from 'gulp-concat';
import rollup from 'gulp-better-rollup';
import rollupBabel from 'rollup-plugin-babel';
import rollupJson from 'rollup-plugin-json';
import rollupYaml from 'rollup-plugin-yaml';
import rollupNodeResolve from 'rollup-plugin-node-resolve';
import rollupCommonjs from 'rollup-plugin-commonjs';
import uglify from 'gulp-uglify';
import nittro from 'gulp-nittro';
import sass from 'gulp-sass';
import autoprefixer from 'gulp-autoprefixer';
import sassLint from 'gulp-sass-lint';
import tilde_importer from 'node-sass-tilde-importer';
import GlobalizeCompiler from 'globalize-compiler';
import cldrData from 'cldr-data';
import neon from 'neon-js/src/neon';

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------
const config = {
  production: !!util.env.production,
  ftpPassword: util.env.ftp_password,
  fix: !!util.env.fix,
  build_dir: 'web/resources',
  sourcemaps_dir: 'maps',

  // Vendor scripts
  vendor_scripts: {
    'vendor.js': [
      nittroBuilder,
      util.env.production ? require.resolve('hammerjs/hammer.min.js') : require.resolve('hammerjs/hammer.js'),
      util.env.production ? require.resolve('d3/d3.min.js') : require.resolve('d3/d3.js'),
      util.env.production ? require.resolve('c3/c3.min.js') : require.resolve('c3/c3.js'),
    ],
    'localization.js': {
      uglify: { compress: true, mangle: true },
      items: [
        require.resolve('cldrjs/dist/cldr.js'),
        require.resolve('globalize/dist/globalize-runtime'),
        require.resolve('globalize/dist/globalize-runtime/message'),
        require.resolve('globalize/dist/globalize-runtime/plural'),
      ],
    },
  },

  // Application scripts (rollup + uglify)
  app_scripts: {
    'loader.js': 'app/resources/scripts/_loader/_main.es6',
    'main.js': 'app/resources/scripts/_main.es6',
  },
  eslint: ['gulpfile.babel.js', 'app/resources/scripts/**/*.{es6,js}'],
  eslint_config: 'app/resources/scripts/.eslintrc.yml',

  // Stylesheets
  stylesheets: {
    'front.css': 'app/resources/stylesheets/front/main.scss',
  },
  stylesheets_blobs: ['app/resources/stylesheets/**/*.{sass,scss,css}'],
  sasslint_config: 'app/resources/stylesheets/.sass-lint.yml',

  // Fonts
  fonts: [
    'node_modules/three/examples/fonts/helvetiker_regular.typeface.json',
    'node_modules/font-awesome/fonts/**/*',
  ],
};

// -----------------------------------------------------------------------------
// Error handler
// -----------------------------------------------------------------------------
function onError(error) {
  util.log((error.plugin ? (`${error.plugin}: `) : ''), util.colors.red(error.message));
  this.emit('end');
}

// -----------------------------------------------------------------------------
// Write asset hash to version.json file (and merge with actual versions)
// -----------------------------------------------------------------------------
function printSize(stream) {
  stream
    .pipe(filter(['**', `!**/${config.sourcemaps_dir}/**`]))
    .pipe(size({ showFiles: true, showTotal: false }));

  return stream;
}

// -----------------------------------------------------------------------------
// Write asset hash to version.json file (and merge with actual versions)
// -----------------------------------------------------------------------------
function storeVersion(stream) {
  const versionFile = `${config.build_dir}/versions.json`;
  return streamqueue.obj(
    gulp.src(versionFile),
    stream
      .pipe(filter(['**', `!**/${config.sourcemaps_dir}/**`]))
      .pipe(bust({ length: 10 })),
  )
    .pipe(mergejson(versionFile))
    .pipe(gulp.dest('./'));
}

// -----------------------------------------------------------------------------
// Merge vendor scripts
// -----------------------------------------------------------------------------
function nittroBuilder() {
  const builder = new nittro.Builder({
    base: {
      core: true,
      datetime: false,
      neon: false,
      di: true,
      forms: true, // note that forms will automatically include the netteForms.js asset
      ajax: true,
      page: true,
      storage: false,
      routing: true,
      flashes: true,
    },
    bootstrap: false,
    stack: false,
  });

  return nittro('js', builder);
}

function mergeScripts(options, target) {
  if (Array.isArray(options)) {
    options = { items: options };
  }

  options = Object.assign({
    uglify: {
      compress: true,
      mangle: false,
    },
  }, options);

  let stream = eventStream.merge([]); // empty stream
  options.items.forEach((module) => {
    stream = streamqueue({ objectMode: true },
      stream,
      typeof (module) === 'function' ? module() : gulp.src(module),
    );
  });

  return storeVersion(
    printSize(stream
      .pipe(gulpif(!config.production, sourcemaps.init({ loadMaps: true })))
      .pipe(concat(target))
      .pipe(gulpif(config.production, uglify(options.uglify)))
      .pipe(gulpif(!config.production, sourcemaps.write(config.sourcemaps_dir)))
      .pipe(gulp.dest(config.build_dir)),
    ),
  );
}

gulp.task('vendor-scripts', () =>
  eventStream.merge(Object.keys(config.vendor_scripts).map(target =>
    mergeScripts(config.vendor_scripts[target], target),
  )));

// -----------------------------------------------------------------------------
// App scripts
// -----------------------------------------------------------------------------
function rollupScript(options, target) {
  if (typeof options === 'string') {
    options = { entrypoint: options };
  }

  options = Object.assign({
    uglify: {
      compress: true,
      mangle: false,
    },
  }, options);

  return storeVersion(
    printSize(gulp.src(options.entrypoint)
      .pipe(plumber(onError))
      .pipe(rollup({
        context: 'window',
        plugins: [
          rollupBabel({
            babelrc: false,
            presets: [['es2015', { modules: false }]],
            plugins: ['external-helpers'],
            exclude: 'node_modules/**',
          }),
          rollupJson(),
          rollupYaml(),
          rollupNodeResolve({
            module: true,
            jsnext: true,
            browser: true,
            extensions: ['.js', '.json', '.es6'],
            preferBuiltins: true,
          }),
          rollupCommonjs({
            include: 'node_modules/**',
          }),
        ],
      }, {
        format: 'es',
      }))
      .pipe(gulpif(!config.production, sourcemaps.init({ loadMaps: true })))
      .pipe(gulpif(config.production, uglify(options.uglify)))
      .pipe(rename(target))
      .pipe(gulpif(!config.production, sourcemaps.write(config.sourcemaps_dir)))
      .pipe(gulp.dest(config.build_dir)),
    ),
  );
}

function lintScripts(fix) {
  return gulp.src(config.eslint, { base: './' })
    .pipe(plumber(onError))
    .pipe(eslint({
      configFile: config.eslint_config,
      fix,
    }))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
    .pipe(gulpif(fix, gulp.dest('.'))); // write fixed files
}

gulp.task('lint-scripts', () => lintScripts());

gulp.task('app-scripts', () =>
  eventStream.merge(Object.keys(config.app_scripts).map(target =>
    rollupScript(config.app_scripts[target], target),
  )));

gulp.task('scripts', ['vendor-scripts', 'app-scripts']);

gulp.task('watch-scripts', () => {
  gulp.watch(
    config.eslint,
    ['app-scripts'],
  ).on('error', onError);

  gulp.watch(
    Object.keys(config.vendor_scripts)
      .map(k => config.vendor_scripts[k])
      .filter(v => typeof v === 'string'),
    ['vendor-scripts'],
  ).on('error', onError);
});

// -----------------------------------------------------------------------------
// Locales
// -----------------------------------------------------------------------------
gulp.task('locales', () => {
  // Compiler preferences
  const compilerPrefs = {
    cldr: cldrData.entireSupplemental(),
    extracts: [],
  };

  Object.keys(config.app_scripts).forEach(
    (file) => {
      try {
        const code = fs.readFileSync(`${config.build_dir}/${file}`, 'utf-8');
        compilerPrefs.extracts.push(GlobalizeCompiler.extract(code));
      } catch (e) {
        console.warn(`Localization: "${e.message}", ${file}`);
      }
    },
  );

  return storeVersion(
    printSize(gulp.src('app/resources/locales/client.*.neon')
      .pipe(plumber(onError))
      .pipe(through.obj(function (file, enc, cb) {
        const pref = Object.assign({}, compilerPrefs);
        pref.defaultLocale = file.path.match(/\/client\.(.*)\.neon$/)[1];
        pref.messages = {};
        pref.messages[pref.defaultLocale] = neon.decode(
            file.contents.toString(), neon.OUTPUT_AUTO,
        );
        pref.cldr = pref.cldr.concat(cldrData.entireMainFor(pref.defaultLocale));

        // Compile
        let code;
        try {
          code = `Globalize.locale("${pref.defaultLocale}");\n`;
          code += GlobalizeCompiler.compileExtracts(pref);
          file.contents = new Buffer(code);
        } catch (e) {
          if (e.message === 'No formatters or parsers has been provided') {
            const msg = `Localization: ${e.message}`;
            code = `/* ${msg} */`;
            console.info(msg);
          } else if (e.path && e.code) {
            const msg = `Localization: ${e.message} (path:"${e.path}", file:"${path.basename(file.path)}").`;
            code = `/* ${msg} */`;
            console.warn(msg);
          } else {
            code = `/* Localization: ${e.message} */`;
            throw e;
          }
        }

        // Send to a level below
        file.contents = new Buffer(code);
        file.base = '/';
        file.path = `/locales/${pref.defaultLocale}.js`;
        this.push(file);
        cb();
      }))
      .pipe(gulpif(config.production, uglify({
        compress: true,
        mangle: false,
      })))
      .pipe(gulp.dest(config.build_dir)),
    ),
  );
});

gulp.task('watch-locales', () => {
  const files = ['app/resources/locales/client.*.neon'];
  Object.keys(config.app_scripts).forEach(file =>
    files.push(`${config.build_dir}/${file}`),
  );
  return gulp.watch(files, ['locales']).on('error', onError);
});

// -----------------------------------------------------------------------------
// Stylesheets
// -----------------------------------------------------------------------------
function compileStylesheet(src, target) {
  return storeVersion(
    printSize(gulp.src(src)
      .pipe(plumber(onError))
      .pipe(gulpif(!config.production, sourcemaps.init({ loadMaps: true })))
      .pipe(sass({
        importer: tilde_importer,
        outputStyle: config.production ? 'compressed' : 'compact',
      }))
      .on('error', sass.logError)
      .pipe(gulpif(config.production, autoprefixer()))
      .pipe(rename(target))
      .pipe(gulpif(!config.production, sourcemaps.write(config.sourcemaps_dir)))
      .pipe(gulp.dest(config.build_dir)),
    ),
  );
}

gulp.task('stylesheets', ['lint-stylesheets'], () =>
  eventStream.merge(Object.keys(config.stylesheets).map(target =>
    compileStylesheet(config.stylesheets[target], target),
  )));

gulp.task('lint-stylesheets', () =>
  gulp.src(config.stylesheets_blobs, { base: './' })
    .pipe(plumber(onError))
    .pipe(sassLint({
      configFile: config.sasslint_config,
    }))
    .pipe(sassLint.format())
    .pipe(sassLint.failOnError()));

gulp.task('watch-stylesheets', () =>
  gulp.watch(config.stylesheets_blobs, ['stylesheets']).on('error', onError),
);

// -----------------------------------------------------------------------------
// Fonts
// -----------------------------------------------------------------------------
function processFonts(options) {
  if (typeof options === 'string') {
    options = { src: options };
  }

  return storeVersion(
    printSize(gulp.src(options.src)
      .pipe(plumber(onError))
      .pipe(rename({
        dirname: 'fonts',
      }))
      .pipe(gulp.dest(config.build_dir)),
    ),
  );
}

gulp.task('fonts', () =>
  eventStream.merge(Object.keys(config.fonts).map(target =>
    processFonts(config.fonts[target], target),
  )));

// -----------------------------------------------------------------------------
// Clean
// -----------------------------------------------------------------------------
gulp.task('clean', () => del([
  `${config.build_dir}/**/*`,
  '!.*',
]));

// -----------------------------------------------------------------------------
// Lint
// -----------------------------------------------------------------------------
gulp.task('lint', ['lint-scripts', 'lint-stylesheets']);

// -----------------------------------------------------------------------------
// Lint + fix errors
// -----------------------------------------------------------------------------
gulp.task('set-fix', () => {
  config.fix = true;
});
gulp.task('lint-fix', ['set-fix', 'lint-scripts', 'lint-stylesheets']);

// -----------------------------------------------------------------------------
// Watch
// -----------------------------------------------------------------------------
gulp.task('watch', ['watch-scripts', 'watch-locales', 'watch-stylesheets']);

// -----------------------------------------------------------------------------
// Default
// -----------------------------------------------------------------------------
gulp.task('default', () => {
  runSequence(
    'clean',
    ['vendor-scripts', 'scripts', 'stylesheets', 'fonts'],
    'locales',
  );
});
