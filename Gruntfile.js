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
                    'image-container.js': 'image-container.ejs',
                    'js/option-converter.js': 'views/option-converter.ejs',
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
                files: ['views/*.ejs'],
                tasks: ['jst']
            },
            typescript: {
                files: ['js/*.ts'],
                tasks: ['typescript']
            }
        }
    });

    grunt.task.registerTask('default', ['jst', 'typescript', 'watch']);
};
