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
                    'option-converter.js': 'option-converter.ejs',
                }
            }
        },

        typescript: {
            extension: {
                src: ['imazip.ts'],
                dest: 'imazip.js',
                options: { ignoreTypeCheck: true }
            },
            option: {
                src: ['options.ts'],
                dest: 'options.js',
                options: { ignoreTypeCheck: true }
            }
        },

        watch: {
            jst: {
                files: ['*.ejs'],
                tasks: ['jst']
            },
            typescript: {
                files: ['*.ts'],
                tasks: ['typescript']
            }
        }
    });

    grunt.task.registerTask('default', ['jst', 'typescript', 'watch']);
};
