var fs = require("fs");

var questionsObj = {};

fs.readFile("questions.txt", "utf-8", function(err, data){
    if(err){console.log(err);}

    var dataArr = data.split("\n");
    for(i=0; i<dataArr.length; i++){
        //console.log(dataArr[i]);
        var QandA = dataArr[i].split(":");
        //console.log(QandA[0]+QandA[1]);
        questionsObj[QandA[0]] = QandA[1].replace("\r", "");
    }
});