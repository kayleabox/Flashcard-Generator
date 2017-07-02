var basic        = require("./BasicCard.js");
var cloze        = require("./ClozeCard.js");
var inquirer     = require("inquirer");
var mysql        = require("mysql");
var fs           = require("fs");

var questionsObj = {};

var map = {
    dadjokes:"jokes",
    streetjokes:"jokes",
    foodjokes:"jokes",
    animaljokes:"jokes",
    miscjokes:"jokes",
    bodyjokes:"jokes",
    weirdwords:"oneword"
}

//information to create database connection
var connection = mysql.createConnection({
    host    :"localhost",
    port    :"3306"     ,

    user    :"root"     ,
    password:"cabbage"  , 
    database:"favorite_db"
});

//query the database
connection.connect(function(err){
    if(err) throw err;
    console.log("connected as id " + connection.threadId);

    connection.query("CREATE DATABASE IF NOT EXISTS flashcards_db", function(err, response){
        if(err) throw err;
    })

    connection.query("USE flashcards_db", 
    function(err, response){
        if(err) throw err;
    })

    connection.query("CREATE TABLE IF NOT EXISTS games(id INTEGER(11) AUTO_INCREMENT NOT NULL PRIMARY KEY, userName VARCHAR(45) NOT NULL, theme VARCHAR(45), correct INTEGER(10) DEFAULT 0, incorrect INTEGER(10) DEFAULT 0)", 
    function(err, response){
        if(err) throw err;
    })

    connection.query("CREATE TABLE IF NOT EXISTS users(id INTEGER(11) AUTO_INCREMENT NOT NULL PRIMARY KEY, userName VARCHAR(45) NOT NULL, pword VARCHAR(50) NOT NULL)", 
    function(err, response){
        if(err) throw err;
    })

    startGame();

})

function getQuestions(username){
    inquirer.prompt([{
        type:   "list",
        name:   "theme",
        message:"what topic would you like?",
        choices:["weird words", "dad jokes", "food jokes", "animal jokes"]
    }]).then(function(answer, err){
        var theme = answer.theme.replace(" ", "");
        fs.readFile(theme + ".txt", "utf-8", function (err, data) {
            if (err) throw err;
            var dataArr = data.split("\n");
            for (i = 0; i < dataArr.length; i++) {
                var QandA = dataArr[i].split(": ");
                var text  = QandA[0] + " " + QandA[1];
                if(map[theme] === "jokes"){
                    var cl = QandA[1].split(".");
                    var text = QandA[0] + " " + cl[0];
                    questionsObj["question" + i] = cloze(text, cl[0]);
                }
                else{
                    questionsObj["question" + i] = cloze(text, QandA[0]);
                }
                //console.log(questionsObj["question"+i].cloze);
            }
            var game = new Game(questionsObj, username, theme);
            //play(game);
            //startGame();
        });
    });

}

function startGame(game){
    //console.log(count);
    inquirer.prompt([{
    type:"confirm",
    name:"play",
    message:"would you like to play the game?"
    }]).then(function(answer, err){
        if(err) throw err;
        if(answer.play){
            getUserStatus();
        }
        else{
            if(game != undefined){
                console.log("thanks! you got "+game.correct+" right! come by again sometime!");
                game.updateStats(game);
            }
            else{console.log("thanks! come again sometime!");}
        }
    })
}

function Game(questionList, username, theme){
    if (this instanceof Game) {
        this.game            = this;
        this.id;
        this.theme           = theme;
        this.cards           = questionList;
        this.count           = 0;
        this.correct         = 0;
        this.incorrect       = 0;
        this.username        = username;
        this.numberQuestions = Object.keys(questionList).lenth;
        this.updateStats = function(game){
            connection.query("UPDATE games SET ? WHERE ?", [{correct:game.correct, incorrect:game.incorrect}, {id: game.id}], 
            function(err, response){
                //console.log("game "+game.id+" was updated");
            })
        }
        this.logGame = function(username, game){
            connection.query("INSERT INTO games SET ?", {userName:username, correct:game.correct, incorrect:game.incorrect, theme:game.theme}, 
            function(err, response){
                //console.log(response);
                game.id = response.insertId;
                console.log("new game! Let's get going!\n");
                game.play(game);
            })
        }
        this.logGame(username, this.game);
    }
    else {
        return new Game(questionList, username);
    }
    
}

Game.prototype.play = function(game){
    var question      = game.cards["question" + game.count].partial;
    var correctAnswer = game.cards["question" + game.count].cloze;
    var fulltext      = game.cards["question" + game.count].full;
    inquirer.prompt([{
        type:    "input",
        name:    "answer",
        message: question
    }]).then(function (answer, err) {
        if (err) throw err;
        if (answer.answer == correctAnswer) {
            console.log("way to go!");
            console.log(fulltext);
            game.count++;
            game.correct++;
            game.cardLoop(game);
        }
        else {
            console.log("good try...");
            console.log(fulltext);
            game.count++;
            game.incorrect++;
            game.cardLoop(game);

        }
    })
}

Game.prototype.cardLoop = function(game){
    if (game.count < Object.keys(game.cards).length) {
        game.play(game);
    }
    else {
        console.log("thanks! you got "+game.correct+" right! come by again sometime!");
        game.updateStats(game);
        startGame(game);
        //connection.query("")
    }
}

function getUserStatus(){
    inquirer.prompt([{
        type:"confirm",
        name:"playedBefore",
        message:"have you played our game before?"
    }]).then(function(answer, err){
        if(err) throw err;
        if(answer.playedBefore){
            signIn();
        }
        else{
            createUser();
        }
    })
}

function signIn(){
    inquirer.prompt([{
        type:    "input",
        name:    "username",
        message: "enter your user name."
    },
    {
        type:    "input",
        name:    "password",
        message: "enter your password"
    }]).then(function (signIn, err) {
        connection.query("SELECT * FROM users pword WHERE userName=? AND pword=?", [signIn.username, signIn.password], 
        function(err, response){
            if(response[0] != undefined){
                if( response[0].pword == signIn.password){
                    console.log("you are logged in!");
                    getQuestions(signIn.username);
                }
            }
            else{
                console.log("we could not find you in our database!");
                getUserStatus();
            }
        })
    })
}

function createUser(){
    inquirer.prompt([{
        type:    "input",
        name:    "username",
        message: "enter your user name."
    },
    {
        type:    "input",
        name:    "password",
        message: "enter your password"
    }]).then(function (create, err) {
        if(err) throw err;
        connection.query("SELECT * FROM users WHERE userName=? AND pword=?", [create.username, create.password], 
        function(err, response){
            if(err) throw err;
            //console.log(response);
            if(response[0] != undefined){
                if( response[0].pword == create.password){
                    console.log("you already have an account!")
                    getQuestions(create.username);
                }
            }
            else{
                connection.query("INSERT INTO users SET ?", {userName:create.username, pword:create.password},
                function(err, response){
                    if(err) throw err;
                    //console.log(response);
                    getQuestions(create.username);
                })
            }
        })
    })
}
