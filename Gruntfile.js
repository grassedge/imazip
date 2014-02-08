module.exports = function(grunt) {
    'use strict';

    grunt.loadNpmTasks('grunt-contrib-jst');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-typescript');

    grunt.initConfig({
        jst: {
            compile: {
                files: {
                    'image-container.js': 'image-container.ejs'
                }
            }
        },

        typescript: {
            extension: {
                src: ['imazip.ts'],
                dest: 'imazip.js',
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
