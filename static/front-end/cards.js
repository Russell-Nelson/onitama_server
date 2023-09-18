class Card {
    constructor(name, starting_color, movement_count, movements) {
        this.name = name;
        this.startingColor = starting_color;
        this.movementCount = movement_count;
        this.movements = movements;
    }
}

var deck = [];
deck[0] = new Card("shark", "blue", 2, [[-2, 0], [1, 0]]);
deck[1] = new Card("crab", "blue", 3, [[-1, 0], [0, -2], [0, 2]]);
deck[2] = new Card("fox", "blue", 4, [[-1, -1], [-1, 1], [1, -1], [1, 1]]);
deck[3] = new Card("crane", "blue", 3, [[-1, 0], [1, -1], [1, 1]]);
deck[4] = new Card("dragon", "red", 4, [[-1, -2], [-1, 2], [1, -1], [1, 1]]);
deck[5] = new Card("elephant", "red", 4, [[-1, -1], [-1, 1], [0, -1], [0, 1]]);
deck[6] = new Card("dragonfly", "red", 3, [[-1, -1], [-1, 1], [1, 0]]);
deck[7] = new Card("turtle", "red", 3, [[-1, 0], [0, -1], [0, 1]]);
deck[8] = new Card("frog", "red", 3, [[-1, -1], [0, -2], [1, 1]]);
deck[9] = new Card("bear", "blue", 4, [[-1, -1], [0, -1], [0, 1], [1, 1]]);
deck[10] = new Card("fish", "red", 3, [[-1, 0], [0, -1], [1, 0]]);
deck[11] = new Card("dog", "blue", 3, [[-1, -1], [0, 1], [1, -1]]);
deck[12] = new Card("rabbit", "blue", 3, [[-1, 1], [0, 2], [1, -1]]);
deck[13] = new Card("rooster", "red", 4, [[-1, 1], [0, 1], [0, -1], [1, -1]]);;
deck[14] = new Card("mouse", "blue", 3, [[-1, 0], [0, 1], [1, 0]]);
deck[15] = new Card("ram", "red", 3, [[-1, 1], [0, -1], [1, 1]]);


function shuffle(array) {
    let currentIndex = array.length,  randomIndex;
  
    // While there remain elements to shuffle.
    while (currentIndex != 0) {
  
      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
  
    return array;
  }
  
shuffle(deck);

function getCardByName(name) {
  for (let i = 0; i < deck.length; i++) {
    if (deck[i].name === name) {
      return deck[i];
    }
  }
}

function getCardByBgImage(path) {
  let name = path.replace(/.*cards\//, "").replace(`.png")`, "");
  for (let i = 0; i < deck.length; i++) {
    if (deck[i].name === name) {
      return deck[i];
    }
  }
}