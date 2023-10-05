function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
};
const csrftoken = getCookie('csrftoken');

const userPawn = `${userColor}-normal`;
const userMaster = `${userColor}-master`;
const opponentPawn = `${opponentColor}-normal`;
const opponentMaster = `${opponentColor}-master`;
var winningColor = `none`;
const pawnSelection = `selection source ${userColor}`;
const destSelection = `selection target ${userColor}`;
const cardSelection = `selection ${userColor}`;
var opponentName = "";
var opponentRating = "";

// add basic listeners and graphics
document.addEventListener('DOMContentLoaded', () => {
    // fill the space graphics
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            let space = document.getElementById(`${i}${j}`);
            space.onclick = clickedSpace;
            space.style.backgroundImage = `url(../../static/images/spaces/${i}${j}.png`;
        }
    }

    let cards = document.getElementsByClassName("card");
    for (let i = 0; i < cards.length; i++) {
        cards[i].onclick = clickedCard;
    }

    selectionState.setWaiting(true);
});

// DOM UTILITY FUNCTIONS

function getPawnElement(space) {
    return document.getElementById(space.id).querySelector(".pawn");
};

function movePawn(source, destination) {
    getPawnElement(destination).className = getPawnElement(source).className;
    getPawnElement(source).className = "pawn";
    return;
};

function getCard(id) {
    return document.getElementById(id);
}

function moveCard(source, destination) {
    destination.style.backgroundImage = source.style.backgroundImage;
    destination.classList.add("nonempty");
    source.style.backgroundImage = "";
    source.classList.remove("nonempty");
    return;
};

function getSelectionElement(space) {
    return space.querySelector(".selection");
};

function endGame() {
    if (winningColor === 'none') {
        return;
    }

    userRating = parseInt(rating);
    opponentRating = parseInt(opponentRating);
    var opponentInfo = document.getElementById("opponent-info");
    var userInfo = document.getElementById("user-info");
    var winnerName;
    if (winningColor === userColor) {
        happySound.play();
        winnerName = userName;
        var dRating = Math.round(calculateEloChange(opponentRating, userRating, 0, 32));
        opponentInfo.querySelector(".rating").innerHTML += ` -${Math.abs(dRating)}`;
        dRating = Math.round(calculateEloChange(userRating, opponentRating, 1, 32));
        userInfo.querySelector(".rating").innerHTML += ` +${dRating}`;
    }
    else {
        sadSound.play();
        winnerName = opponentName;
        var dRating = Math.round(calculateEloChange(opponentRating, userRating, 1, 32));
        opponentInfo.querySelector(".rating").innerHTML += ` +${dRating}`;
        dRating = Math.round(calculateEloChange(userRating, opponentRating, 0, 32));
        userInfo.querySelector(".rating").innerHTML += ` -${Math.abs(dRating)}`;
    }

    selectionState.gameOver = true;
    selectionState.setWaiting(false);
    document.getElementById("opponent-info").classList.remove("active");
    document.getElementById("user-info").classList.remove("active");

    document.getElementById("chat").innerHTML += `\n${winnerName} wins!`;

    var results = document.getElementById("results");
    results.classList.add(winningColor);
    results.classList.remove("inactive");
    results.querySelector("div").innerHTML = `${winnerName} wins!`;
    results.querySelector("button").onclick = function() {
        document.getElementById("results").classList.add("inactive");
    }

    let cards = document.getElementsByClassName("card");
    for (let i = 0; i < cards.length; i++) {
        cards[i].classList.add("game-over");
    }

    if (isOwner) {
        var winner;
        if (winningColor === userColor) {
            winner = "owner";
        }
        else {
            winner = "opponent";
        }
        gameSocket.send(JSON.stringify({
            'type': "game_over",
            'winner': winner,
        }));
    }
}

const selectionState = {
    source: null,
    card: null,
    destination: null,
    waiting: true,
    possibleDestinations:[],
    gameOver: false,

    setWaiting(value) {
        this.waiting = value;

        if (this.waiting) {
            document.getElementById("opponent-info").classList.add("active");
            document.getElementById("user-info").classList.remove("active");
        }
        else {
            document.getElementById("user-info").classList.add("active");
            document.getElementById("opponent-info").classList.remove("active");                    
        }
    },

    updateSource(newSource) {
        if (this.waiting || gameHistory.active || this.gameOver) {
            return;
        }
        if (this.source !== null) {
            getSelectionElement(this.source).className = "selection";
        }
        this.source = newSource;
        getSelectionElement(this.source).className = pawnSelection;
        this.updatePossibleDestinations();
    },

    updateCard(newCard) {
        if (this.waiting || gameHistory.active || this.gameOver) {
            return;
        }
        if (this.card !== null) {
            this.card.querySelector(".selection").className = "selection";
        }
        this.card = newCard;
        this.card.querySelector(".selection").className = cardSelection;
        this.updatePossibleDestinations();
    },

    updatePossibleDestinations() {
        this.possibleDestinations.forEach(function (e) {
            getSelectionElement(e).className = "selection";
        });
        this.possibleDestinations = [];
        if (this.source === null || this.card === null) {
            return;
        }
        var card = getCardByBgImage(this.card.style.backgroundImage);

        var pos = [parseInt(this.source.id[0]), parseInt(this.source.id[1])];

        for (let i = 0; i < card.movementCount; i++) {
            var targetPos = [pos[0] + card.movements[i][0], pos[1] + card.movements[i][1]];
            
            if (targetPos[0] > 4 || targetPos[0] < 0) continue;
            if (targetPos[1] > 4 || targetPos[1] < 0) continue;

            var targetSpace = document.getElementById(`${targetPos[0]}${targetPos[1]}`);
            var targetPawnElement = getPawnElement(targetSpace);
            if (targetPawnElement.className.includes(userColor)) {
                continue;
            }

            getSelectionElement(targetSpace).className = destSelection;
            this.possibleDestinations.push(targetSpace);
        }        
    },

    clear() {
        this.clearGraphics();
        this.source = null;
        this.card = null;
        this.destination = null;
        this.updatePossibleDestinations();
    },

    clearGraphics() {
        this.possibleDestinations.forEach(function (e) {
            getSelectionElement(e).className = "selection";
        });
        if (this.source != null) {
            getSelectionElement(this.source).className = "selection";
        }
        if (this.card != null) {
            this.card.querySelector(".selection").className = "selection";
        }
    }
}

function clickedSpace(e) {
    let space = e.currentTarget;
    let pawnInfo = space.querySelector(".pawn").className;
    if (pawnInfo.includes(userColor)) {
        selectionState.updateSource(space);
        return;
    }
    else if (selectionState.pawn === null) {
        return;
    }

    if (selectionState.possibleDestinations.includes(space)) {
        selectionState.destination = space;
        selectionState.setWaiting(true);
        sendMove();
    }
}

function clickedCard(e) {
    let card = e.currentTarget
    let id = card.getAttribute("id");
    if (id === "user_card_0" || id === "user_card_1") {
        selectionState.updateCard(card);
    }
}

function mirror(spaceId) {
    var row = parseInt(spaceId[0]);
    var col = parseInt(spaceId[1]);
    row = 4 - row;
    col = 4 - col;
    return row.toString() + col.toString();
}

// ANITMAION FUNCTIONS

function animatePawn(source, destination, capturedClass=null) {
    var sourcePawn = getPawnElement(source);
    var destPawn = getPawnElement(destination);
    var dx = destPawn.getBoundingClientRect().x - sourcePawn.getBoundingClientRect().x;
    var dy = destPawn.getBoundingClientRect().y - sourcePawn.getBoundingClientRect().y;
    sourcePawn.style.zIndex = "3";
    sourcePawn.style.transition = "transform 0.2s ease-out 0s";
    sourcePawn.style.transform = `translate(${dx}px, ${dy}px)`;

    sourcePawn.addEventListener("transitionend", function pawnCleanup() {
        sourcePawn.style.zIndex = "2";
        sourcePawn.style.transition = "";
        sourcePawn.style.transform = ""; 
        movePawn(source, destination);
        if (capturedClass != null) {
            sourcePawn.className = capturedClass;
        }
        sourcePawn.removeEventListener("transitionend", pawnCleanup);
    });
}

function animateCard(source, destination, shouldRotate, delay, lastHistoryAnimation=false) {
    var dx = destination.getBoundingClientRect().x - source.getBoundingClientRect().x;
    var dy = destination.getBoundingClientRect().y - source.getBoundingClientRect().y;
    source.style.zIndex = "5";
    source.style.transition = `transform 0.5s ease-out ${delay}s`;
    if (shouldRotate) {
        source.style.transform = `matrix(-1, 0, 0, -1, ${dx}, ${dy})`;

    }
    else {
        source.style.transform = `matrix(1, 0, 0, 1, ${dx}, ${dy})`;
    }

    source.addEventListener("transitionend", function cardCleanup() {
        source.style.zIndex = "3";
        source.style.transition = "";
        source.style.transform = "";
        moveCard(source, destination);
        if (lastHistoryAnimation) {
            gameHistory.blocking = false;
        }
        source.removeEventListener("transitionend", cardCleanup);
    })
}


// SOCKET LOGIC
const gameSocket = new WebSocket(
    'ws://'
    + window.location.host
    + '/ws/multiplayer/'
    + gameId
    + '/'
);

function drawCards() {
    gameSocket.send(JSON.stringify({
        'type': "cards",
        'ownerCard0': deck[0].name,
        'ownerCard1': deck[1].name,
        'opponentCard0': deck[2].name,
        'opponentCard1': deck[3].name,
        'middleCard': deck[4].name,
    }));
}

function fillCards(data) {
    if (isOwner) {
        getCard("user_card_0").style.backgroundImage = "url(../../static/images/cards/" + data["ownerCard0"] + ".png)";
        getCard("user_card_1").style.backgroundImage = "url(../../static/images/cards/" + data["ownerCard1"] + ".png)";
        getCard("opponent_card_0").style.backgroundImage = "url(../../static/images/cards/" + data["opponentCard0"] + ".png)";
        getCard("opponent_card_1").style.backgroundImage = "url(../../static/images/cards/" + data["opponentCard1"] + ".png)";
    }
    else {
        getCard("opponent_card_0").style.backgroundImage = "url(../../static/images/cards/" + data["ownerCard0"] + ".png)";
        getCard("opponent_card_1").style.backgroundImage = "url(../../static/images/cards/" + data["ownerCard1"] + ".png)";
        getCard("user_card_0").style.backgroundImage = "url(../../static/images/cards/" + data["opponentCard0"] + ".png)";
        getCard("user_card_1").style.backgroundImage = "url(../../static/images/cards/" + data["opponentCard1"] + ".png)";
    }
    var middle_card = getCardByName(data["middleCard"]);
    if (middle_card.startingColor == userColor) {
        getCard("middle_card_1").style.backgroundImage = "url(../../static/images/cards/" + data["middleCard"] + ".png)";
        getCard("middle_card_1").classList.add("nonempty");
        selectionState.setWaiting(false);
    }
    else {
        getCard("middle_card_0").style.backgroundImage = "url(../../static/images/cards/" + data["middleCard"] + ".png)";
        getCard("middle_card_0").classList.add("nonempty");
        selectionState.setWaiting(true);
    }
}

function fillOpponentInfo(data) {
    if (isOwner) {
        opponentName = data["opponentName"];
        opponentRating = data["opponentRating"];
    }
    else {
        opponentName = data["ownerName"];
        opponentRating = data["ownerRating"];
    }
    var opponentInfo = document.getElementById("opponent-info");
    opponentInfo.querySelector(".name").innerHTML = opponentName;
    opponentInfo.querySelector(".rating").innerHTML = `(${opponentRating})`;
    document.querySelector("title").innerHTML = "Play vs " + opponentName + " | Play-Onitama.com";
    // TODO: add rating update

}

function calculateEloChange(ratingA, ratingB, points, k) {
    let eA = 1 / ( 1 + 10 ** (( ratingB - ratingA ) / 400 ));
    return k * ( points - eA );
}

function checkForWin(sourceId, targetId) {
    var targetClass = getPawnElement(document.getElementById(targetId)).className;
    if (targetClass.includes(opponentMaster)) {
        winningColor = userColor;
        return;
    }
    if (targetClass.includes(userMaster)) {
        winningColor = opponentColor;
        return;
    }
    var sourceClass = getPawnElement(document.getElementById(sourceId)).className;
    if (sourceClass.includes(userMaster) && targetId === "02") {
        winningColor = userColor;
        return;
    }
    if (sourceClass.includes(opponentMaster) && targetId === "42") {
        winningColor = opponentColor;
        return;
    }
    return;
}

function sendMove() {
    selectionState.setWaiting(true);
    var moveInfo = {
        'type': 'move',
        'color': userColor,
        'source': selectionState.source.id,
        'target': selectionState.destination.id,
        'cardIndex': selectionState.card.id[selectionState.card.id.length - 1],
    };

    // update visual aspects
    selectionState.clearGraphics();

    selectionState.clear();
    gameSocket.send(JSON.stringify(moveInfo));
}

function performMove(data) {
    var color = data['color'];
    var sourceId = data['source'];
    var targetId = data['target'];
    if (color != userColor) {
        sourceId = mirror(sourceId);
        targetId = mirror(targetId);
    }
    checkForWin(sourceId, targetId);
    var source = document.getElementById(sourceId);
    var target = document.getElementById(targetId);
    var playedCard;
    if (color === userColor) {
        playedCard = getCard("user_card_" + data['cardIndex']);
    }
    else {
        playedCard = getCard("opponent_card_" + data['cardIndex']);
    }

    // push to game history
    let thisMove = new Move(color, source, target, getPawnElement(target).className, playedCard);
    gameHistory.moves.push(thisMove);
    gameHistory.position++;
    gameHistory.updateGraphics();


    selectionState.clearGraphics();
    if (getPawnElement(target).className.includes("nonempty")) {
        captureSound.play();
    }
    else {
        moveSound.play();
    }
    animatePawn(source, target);

    // then move the card
    if (color === userColor) {
        var destCard = getCard("middle_card_0");
        var fillCard = getCard("middle_card_1");
        var rotateFlag = true;
    }
    else {
        var destCard = getCard("middle_card_1");
        var fillCard = getCard("middle_card_0");
        var rotateFlag = false;
    }

    animateCard(playedCard, destCard, rotateFlag, 0);
    animateCard(fillCard, playedCard, !rotateFlag, .2);
    fillCard.addEventListener("transitionend", function finishMove() {
        this.removeEventListener("transitionend", finishMove);
        selectionState.clear();
        if (color != userColor) {
            selectionState.setWaiting(false);
        }
        if (winningColor != "none") {
            endGame();
            return;
        }
    });
}

gameSocket.onmessage = function(e) {
    const data = JSON.parse(e.data);

    if (data["type"] === "setup") {
        fillOpponentInfo(data);
        if (isOwner) {
            drawCards();
        }
        return;
    }

    if (data["type"] === "cards") {
        fillCards(data);
    }

    if (data["type"] === "move") {
        performMove(data);
    }

    if (data["type"] === "disconnected") {
        loserName = data["disconnectedPlayer"]
        document.getElementById("chat").innerHTML += `\n${loserName} disconnected.`;
        if (loserName === userName) {
            winningColor = opponentColor;
        }
        if (loserName === opponentName) {
            winningColor = userColor;
        }
        endGame();
    }
};

gameSocket.onclose = function(e) {
    console.error('Chat socket closed unexpectedly');
};

// GAME HISTORY MODULE

class Move {
    constructor (color, source, destination, capturedClass, card) {
        this.color = color;
        this.source = source;
        this.destination = destination;
        this.capturedClass = capturedClass;
        this.card = card;
    }

    advance() {
        gameHistory.blocking = true;
        animatePawn(this.source, this.destination);
        if (this.color === userColor) {
            animateCard(this.card, getCard("middle_card_0"), true, 0);
            animateCard(getCard("middle_card_1"), this.card, false, 0.05, true);
        }
        else {
            animateCard(this.card, getCard("middle_card_1"), false, 0);
            animateCard(getCard("middle_card_0"), this.card, true, 0.05, true);
        }
    }

    rewind() {
        gameHistory.blocking = true;
        animatePawn(this.destination, this.source, this.capturedClass);
        if (this.color === userColor) {
            animateCard(this.card, getCard("middle_card_1"), false, 0);
            animateCard(getCard("middle_card_0"), this.card, false, 0.05, true);
        }
        else {
            animateCard(this.card, getCard("middle_card_0"), true, 0);
            animateCard(getCard("middle_card_1"), this.card, true, 0.05, true);
        }
    }
}

class GameHistory {
    constructor() {
        this.moves = [];
        this.position = 0;
        this.active = false;
        this.blocking = false;
    }

    stepBackward() {
        if (this.position === 0 || selectionState.waiting || this.blocking) {return;};               
        selectionState.clear();
        this.active = true;
        document.getElementById("opponent-info").classList.add("history-standby");
        document.getElementById("user-info").classList.add("history-standby");
        this.position--;
        this.moves[this.position].rewind();
        this.updateGraphics();
    }

    stepForward() {
        if (!this.active || this.blocking) {return;};
        this.moves[this.position].advance();
        this.position++;
        if (this.position === this.moves.length) {
            this.active = false;
            document.getElementById("opponent-info").classList.remove("history-standby");
            document.getElementById("user-info").classList.remove("history-standby");
        }
        this.updateGraphics();
    }

    updateGraphics() {
        if (this.position === 0) {
            document.getElementById("step_backward").classList.remove("active");
        }
        else {
            document.getElementById("step_backward").classList.add("active");
        }
        if (this.position === this.moves.length) {
            document.getElementById("step_forward").classList.remove("active");
        }
        else {
            document.getElementById("step_forward").classList.add("active");
        }
    }
}

var gameHistory = new GameHistory();

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById("step_forward").onclick = function () {
        gameHistory.stepForward();
    };
    document.getElementById("step_backward").onclick = function () {
        gameHistory.stepBackward();
    };
});


// SOUND MODULE

function sound(src) {
    this.sound = document.createElement("audio");
    this.sound.src = src;
    this.sound.setAttribute("preload", "auto");
    this.sound.setAttribute("controls", "none");
    this.sound.style.display = "none";
    document.body.appendChild(this.sound);
    this.play = function(){
      this.sound.play();
    }
    this.stop = function(){
      this.sound.pause();
    }
}

var moveSound = new sound("../../static/sounds/move.mp3");
var captureSound = new sound("../../static/sounds/capture.mp3");
var happySound = new sound("../../static/sounds/happy.mp3");
var sadSound = new sound("../../static/sounds/sad.mp3");