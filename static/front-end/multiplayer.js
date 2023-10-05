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
}
const csrftoken = getCookie('csrftoken');

const userPawn = `${userColor}-normal`;
const userMaster = `${userColor}-master`;
const opponentPawn = `${opponentColor}-normal`;
const opponentMaster = `${opponentColor}-master`;
var winningColor = `none`;
const pawnSelection = `selection selection-pawn-${userColor}`;
const destSelection = `selection selection-dest-${userColor}`;
const cardSelection = `selection-card-${userColor}`;



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
    source.style.backgroundImage = "";
    return;
};

function getSelectionElement(space) {
    return space.querySelector(".selection");
};

const selectionState = {
    source: null,
    card: null,
    destination: null,
    waiting: true,
    possibleDestinations:[],

    updateSource(newSource) {
        if (this.waiting) {
            return;
        }
        if (this.source !== null) {
            getSelectionElement(this.source).className = "selection selection-empty";
        }
        this.source = newSource;
        getSelectionElement(this.source).className = pawnSelection;
        this.updatePossibleDestinations();
    },

    updateCard(newCard) {
        if (this.waiting) {
            return;
        }
        if (this.card !== null) {
            this.card.firstElementChild.setAttribute("class", "selection-card-empty");
        }
        this.card = newCard;
        this.card.firstElementChild.setAttribute("class", cardSelection);
        this.updatePossibleDestinations();
    },

    updatePossibleDestinations() {
        this.possibleDestinations.forEach(function (e) {
            getSelectionElement(e).className = "selection selection-empty";
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
            getSelectionElement(e).className = "selection selection-empty";
        });
        if (this.source != null) {
            getSelectionElement(this.source).className = "selection selection-empty";
        }
        if (this.card != null) {
            this.card.firstElementChild.setAttribute("class", "selection-card-empty");
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
        selectionState.waiting = true;
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


// build the HTML for the spaces and pieces
document.addEventListener('DOMContentLoaded', () => {

    let cards = document.getElementsByClassName("card");
    for (let i = 0; i < cards.length; i++) {
        cards[i].onclick = clickedCard;
    }

    var board = document.getElementsByClassName("board")[0];
    board.style.backgroundImage = "url(../../static/images/board-background.png)";

    // create the spaces
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            let space = document.createElement("div");
            space.setAttribute("class", "space");
            space.setAttribute("id", `${i}${j}`);
            space.style.backgroundImage = `url(../../static/images/spaces/${i}${j}.png`;
            space.onclick = clickedSpace;
            board.appendChild(space);

            let pawn_element = document.createElement("div");
            pawn_element.classList.add("pawn");
            pawn_element.classList.add("pawn-empty");
            space.appendChild(pawn_element);

            let selection_element = document.createElement("div");
            selection_element.classList.add("selection");
            selection_element.classList.add("selection-empty");
            space.appendChild(selection_element);
        }
    }


    // create the opponent's pieces
    for (let i = 0; i < 5; i++) {
        let space = document.getElementById(`0${i}`);
        if (i == 2) {
            space.querySelector(".pawn").classList.remove("pawn-empty");
            space.querySelector(".pawn").classList.add(opponentMaster);
            // TODO: put temples back in and fix positioning
            // var blue_temple = document.createElement("div");
            // blue_temple.classList.add("blue-temple");
            // space.appendChild(blue_temple);
        }
        else {
            space.querySelector(".pawn").classList.remove("pawn-empty");
            space.querySelector(".pawn").classList.add(opponentPawn);
        }
    }

    // create the user's pieces
    for (let i = 0; i < 5; i++) {
        let space = document.getElementById(`4${i}`);
        if (i == 2) {
            space.querySelector(".pawn").classList.remove("pawn-empty");
            space.querySelector(".pawn").classList.add(userMaster);
            // TODO: temple
            // var red_temple = document.createElement("div");
            // red_temple.classList.add("red-temple");
            // space.appendChild(red_temple);
        }
        else {
            space.querySelector(".pawn").classList.remove("pawn-empty");
            space.querySelector(".pawn").classList.add(userPawn);
        }
    }
});



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
        selectionState.waiting = false;
    }
    else {
        getCard("middle_card_0").style.backgroundImage = "url(../../static/images/cards/" + data["middleCard"] + ".png)";
    }
}

function fillNames(data) {
    ownerName = data["ownerName"];
    opponentName = data["opponentName"];
    document.getElementById("vs").innerHTML = "VS";
    if (isOwner) {
        document.getElementById("user-tag").innerHTML = ownerName;
        document.getElementById("opponent-tag").innerHTML = opponentName;
        document.querySelector("title").innerHTML = "Onitama vs " + opponentName;
    }
    else {
        document.getElementById("user-tag").innerHTML = opponentName;
        document.getElementById("opponent-tag").innerHTML = ownerName;
        document.querySelector("title").innerHTML = "Onitama vs " + ownerName;
    }
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
    selectionState.waiting = true;
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
    selectionState.clearGraphics();
    animatePawn(source, target);

    // then move the card
    if (color === userColor) {
        var playedCard = getCard("user_card_" + data['cardIndex']);
        var destCard = getCard("middle_card_0");
        var fillCard = getCard("middle_card_1");
        var rotateFlag = true;
    }
    else {
        var playedCard = getCard("opponent_card_" + data['cardIndex']);
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
            selectionState.waiting = false;
        }
        if (winningColor != "none") {
            selectionState.waiting = true;
            alert(winningColor + " wins!");
            return;
        }
    });
}

gameSocket.onmessage = function(e) {
    const data = JSON.parse(e.data);

    if (data["type"] === "setup") {
        fillNames(data);
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
};

gameSocket.onclose = function(e) {
    console.error('Chat socket closed unexpectedly');
};