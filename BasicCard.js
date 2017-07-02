
function BasicCard (front, back){
    if(front !== undefined && back !== undefined){
        if (this instanceof BasicCard) {
            this.front = front;
            this.back  = back;
        }
        else {
            return new BasicCard(front, back);
        }
    }
    else{console.log("enter front and back");}
    /*this.getCard = function(){
        console.log(this.front);
    }*/
}


module.exports = BasicCard;