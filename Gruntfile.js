module.exports = function(grunt) {
    'use strict';

    grunt.loadNpmTasks('grunt-contrib-jst');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-typescript');

    grunt.initConfig({
        jst: {
            options: {
                processName: function(filepath) {
                    return filepath.replace(/^views\//, '')
                        .replace(/\.(.*)$/, '')
                        .replace(/\//g, '-');
                }
            },
            compile: {
                files: {
                    'js/download-jst.js' : 'views/download/image-container.ejs',
                    'js/option-jst.js': 'views/option/*.ejs',
                }
            }
        },

        typescript: {
            download: {
                src: ['js/download.ts'],
                dest: 'js/download.js',
                options: { ignoreTypeCheck: true }
            },
            'pick-url': {
                src: ['js/pick-url.ts'],
                dest: 'js/pick-url.js',
                options: { ignoreTypeCheck: true }
            },
            option: {
                src: ['js/options.ts'],
                dest: 'js/options.js',
                options: { ignoreTypeCheck: true }
            }
        },

        watch: {
            jst: {
                files: ['views/**/*.ejs'],
                tasks: ['jst']
            },
            'typescript-download': {
                files: ['js/download.ts'],
                tasks: ['typescript:download']
            },
            'typescript-url': {
                files: ['js/pick-url.ts'],
                tasks: ['typescript:pick-url']
            },
            'typescript-option': {
                files: ['js/options.ts'],
                tasks: ['typescript:option']
            },
        }
    });

    grunt.task.registerTask('default', ['jst', 'typescript', 'watch']);
};
