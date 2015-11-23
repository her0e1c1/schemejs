/*jshint node:true */
'use strict';

module.exports = function (grunt) {
    grunt.initConfig({
        jshint: {
            files: ['Gruntfile.js', 'src/*.js', 'test/*.js'],
            options: {
                globals: {
                    jQuery: true
                }
            }
        },
        qunit: {
            all: {
				options: {
					urls: ['http://127.0.0.1:9998/']
                }
            }
        },
        watch: {
            options: {
                livereload: true
            },
            files: '{src,test}/**/*.js',
            tasks: 'default'
        }
        // watch: {
        //     files: ['<%= jshint.files %>'],
        //     tasks: ['jshint']
        // }
    });

    // Loading dependencies
    for (var key in grunt.file.readJSON('package.json').devDependencies) {
        if (key !== 'grunt' && key.indexOf('grunt') === 0) {
            grunt.loadNpmTasks(key);
        }
    }
    grunt.registerTask('test', ['jshint', 'qunit']);

    grunt.registerTask('default', ['jshint']);
};
