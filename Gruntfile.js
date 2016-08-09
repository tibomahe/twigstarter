module.exports = function(grunt) {

	require('load-grunt-tasks')(grunt);

	grunt.initConfig({

		//Gruntfile var

		vendorsPath : './vendor/assets',
		srcAssets : './resources/assets',
		srcPartials : './resources/views/partials',
		buildAssets : './public/assets',
		pkg: grunt.file.readJSON('package.json'),

		//Tasks for JavaScript

		eslint: {
			options: {
				useEslintrc: true,
			},
			target: ['<%= srcAssets %>/js/*.js']
		},

		browserify: {
			dist: {
				options: {
					transform: [["babelify", { "presets": ["es2015"] }]]
				},
				files: {
					"<%= buildAssets %>/js/main-babelified.js": "<%= srcAssets %>/js/main.js"
				}
			}
		},

		concat: {
			options: {
				separator: ';\n', // Avoid syntax error on Smart-Table concat
			},
			main: {
				src: ['<%= vendorsPath %>/jquery/dist/jquery.js',
				'<%= vendorsPath %>/bootstrap-sass/assets/javascripts/bootstrap.js',
				'<%= buildAssets %>/js/main-babelified.js'],
				dest: '<%= buildAssets %>/js/<%= pkg.name %>-<%= pkg.version %>.js',
				nonull: true,
			},
			ieSupport: {
				src: ['<%= vendorsPath %>/html5shiv/dist/html5shiv.js',
				'<%= vendorsPath %>/respond/dest/respond.src.js'],
				dest: '<%= buildAssets %>/js/<%= pkg.name %>-<%= pkg.version %>-ie-support.js',
				nonull: true,
			}
		},

		uglify : {
			options: {
				mangle: false
			},
			js: {
				files: {
					'<%= buildAssets %>/js/<%= pkg.name %>-<%= pkg.version %>.min.js' : [ '<%= buildAssets %>/js/<%= pkg.name %>-<%= pkg.version %>.js' ],
					'<%= buildAssets %>/js/<%= pkg.name %>-<%= pkg.version %>-ie-support.min.js' : ['<%= buildAssets %>/js/<%= pkg.name %>-<%= pkg.version %>-ie-support.js']
				}
			}
		},

		//Tasks for PHP

		php: {
			dist: {
				options: {
					keepalive: false,
					port: 8080,
					base: 'public',
					hostname: 'localhost',
					open: true,
					silent: true,
				}
			}
		},

		//Tasks for CSS

		postcss: {
			options: {
				map: true,
				processors: [
				require('autoprefixer')({browsers: ['last 2 versions']})
				]
			},
			dist: {
				options: {
					browsers: ['last 2 version', 'ie 9', 'Firefox > 20', 'Safari > 5'],
					flatten: true
				},
				files: {
					'<%= buildAssets %>/css/main.css' : ['<%= buildAssets %>/css/main.css'],
				}
			}
		},

		csso: {
			compress: {
				options: {
					report: 'min'
				},
				files: {
					'<%= buildAssets %>/css/<%= pkg.name %>-<%= pkg.version %>.min.css': '<%= buildAssets %>/css/main.css',
					//export to partials in twig so it can be included
					'<%= srcPartials %>/critical-home.twig': '<%= srcAssets %>/criticalcss/critical-home.css'
				}
			}
		},

		sass: {
			options: {
				sourceMap: false
			},
			dist: {
				files: {
					'<%= buildAssets %>/css/main.css': '<%= srcAssets %>/scss/main.scss'
				}
			}
		},

		//When the critical css is generated, copy and paste it
		//to insert it in the adequate view.
		criticalcss: {
			home: {
				options:  {
					outputfile : '<%= srcAssets %>/criticalcss/critical-home.css',
					filename : '<%= buildAssets %>/css/main.css',
					url : 'http://localhost:8080',
					width: 1200,
					height: 900
				}
			}
		},

		//Tasks for images and fonts

		imagemin: {
			dynamic: {
				files: [{
					expand: true,
					cwd: '<%= srcAssets %>/im/',
					src: ['**/*.{png,jpg,gif}'],
					dest: '<%= srcAssets %>/im/'
				}]
			}
		},

		copy: {
			main: {
				files: [
				{expand: true, cwd: '<%= srcAssets %>/', src: ['fonts/**'], dest: '<%= buildAssets %>'},
				],
			},
			images: {
				files: [
				{expand: true, cwd: '<%= srcAssets %>/', src: ['im/**'], dest: '<%= buildAssets %>'},
				],
			},
		},

		//Tasks for livereload

		delta: {
			options: {
				livereload: true,
			},
			gruntfile: {
				files: 'Gruntfile.js',
				tasks: [ 'eslint', 'browserify', 'concat', 'uglify', 'clean', 'sass', 'postcss', 'csso' ],
				options: {
					livereload: false
				}
			},
			sass: {
				files: '<%= srcAssets %>/scss/main.scss',
				tasks: ['sass', 'postcss', 'csso', 'clean','csscount'],
			},
			script: {
				files: '<%= srcAssets %>/js/main.js',
				tasks: ['eslint', 'browserify', 'concat', 'uglify', 'clean']
			},
			html: {
				files: ['*.twig', '*/*.twig', '*/*/*.twig'],
				tasks: ['sass', 'postcss', 'csso', 'clean']
			},
			images: {
				files: ['<%= srcAssets %>/im/*'],
				tasks: ['imagemin', 'copy:images']
			},
			fonts: {
				files: ['<%= srcAssets %>/fonts/**/*'],
				tasks: ['copy:main']
			}
		},

		//Tasks for stats

		csscount: {
			dev: {
				src: [
				'<%= buildAssets %>/css/main.css'
				],
				options: {
					maxSelectors: 4095,
					maxSelectorDepth: false
				}
			}
		},

		//Tasks for grunt

		concurrent: {
			transform: ['browserify', 'sass'],
			minify: ['csso', 'uglify'],
			optim: ['imagemin', 'copy:images', 'criticalcss']
		},

		clean: {
			dist: [
				"<%= buildAssets %>/js/main-babelified.js",
				"<%= buildAssets %>/js/<%= pkg.name %>-<%= pkg.version %>.js",
				"<%= buildAssets %>/js/<%= pkg.name %>-<%= pkg.version %>-ie-support.js",
				"<%= buildAssets %>/css/main.css",
				"<%= srcAssets %>/criticalcss/critical-home.css"
			]
		}

	});

grunt.registerTask('images', ['imagemin', 'copy:images']);
grunt.registerTask('critical', ['criticalcss', 'csso', 'clean']);
grunt.registerTask('stats', ['csscount']);
grunt.renameTask( 'watch', 'delta' );
grunt.registerTask('default', [
	'eslint',
	'concurrent:transform',
	'postcss',
	'csscount',
	'concat',
	'concurrent:minify',
	'clean',
	'copy',
	'php:dist',
	'delta'
]);
grunt.registerTask('prod', [
	'eslint',
	'concurrent:transform',
	'postcss',
	'csscount',
	'concat',
	'concurrent:optim',
	'concurrent:minify',
	'copy:main',
	'clean'
]);

};
