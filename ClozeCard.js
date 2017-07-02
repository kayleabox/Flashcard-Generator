function ClozeCard (text, cloze) {
    if(cloze == undefined || text == undefined){
        console.log("enter a cloze");
    }
    else{
        if (this instanceof ClozeCard) {
            this.full    = text;
            this.partial = text.replace(cloze, '');
            this.cloze   = cloze;
        }
        else {
            return new ClozeCard(text, cloze);
        }
    }
}


module.exports = ClozeCard;