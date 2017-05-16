module.exports = function (grunt) {
    grunt.initConfig({
        watch: {
            reports: {
                files: ['*.json'],
                options: {
                    spawn: false
                }
            }
        },
        exec: {
            reportAnalizer: {
                cmd: function (fileToAnalize) {
                    return "node analize.js \"" + fileToAnalize + "\"";
                }
            },
            server: {
                cmd: function () {
                    return "node server.js";
                }
            }
        },
        sass: {
            options: {
                sourceMap: true
            },
            dist: {
                files: {
                    'css/style.css': 'css/style.scss'
                }
            }
        },
        concurrent: {
            serverAndWatch: {
                tasks: ['exec:server','watch'],
                options: {
                    logConcurrentOutput: true
                }
            }
        }
    });

    //carico task da runnare
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-exec');
    grunt.loadNpmTasks('grunt-sass');
    grunt.loadNpmTasks('grunt-concurrent');
 
    //evento watch
    grunt.event.on('watch', function (action, filepath, target) {
        grunt.task.run("exec:reportAnalizer:" + filepath);
    });
    
    //creo default task che parte alla chiamata di grunt 
    grunt.registerTask('default', ['concurrent:serverAndWatch']);
    grunt.registerTask('server', ['exec:server']);
    grunt.registerTask('compile', ['sass']);


};