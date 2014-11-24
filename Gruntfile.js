module.exports = function(grunt) {
    'use strict';

    grunt.loadNpmTasks('grunt-contrib-jst');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-less');
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
                options: { ignoreError: true }
            },
            'pick-url': {
                src: ['js/pick-url.ts'],
                dest: 'js/pick-url.js',
                options: { ignoreError: true }
            },
            option: {
                src: ['js/options.ts'],
                dest: 'js/options.js',
                options: { ignoreError: true }
            },
            background: {
                src: ['js/background.ts'],
                dest: 'js/background.js',
                options: { ignoreError: true }
            }
        },

        less: {
            options: {
                compress: false
            },
            pc: {
                files: {
                    'css/download.css': 'css/download.less'
                }
            },
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
            'typescript-background': {
                files: ['js/background.ts'],
                tasks: ['typescript:background']
            },
            'less-download': {
                files: ['css/download.less'],
                tasks: ['less:pc']
            }
        }
    });

    grunt.task.registerTask('default', ['jst', 'typescript', 'less', 'watch']);
};
