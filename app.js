var app = angular.module('portfolio', []);

var projects = [
    {
        name: "Mini Synth",
        tags: ["html", "css", "js", "web audio api"]
    },
    {
        name: "NC Pipper Peeper",
        tags: ["html", "bootstrap", "django"]
    },
    {
        name: "Tile Game",
        tags: ["html", "js", "phaser"]
    }
];

app.controller('ProjectController', function(){
    this.projects = projects;
});