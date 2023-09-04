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

// DOM UTILITY FUNCTIONS

function getPawnElement(space) {
    return document.getElementById(space.id).querySelector(".pawn");
};

function movePawn(source, destination) {
    getPawnElement(destination).className = getPawnElement(source).className;
    getPawnElement(source).className = "pawn pawn-empty";
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
}

// ANIMATION FUNCTIONS

function displayHourglass() {
    let hourglass = document.getElementById("hourglass");
    hourglass.classList.add("hourglass-show");
    return;
}

function removeHourglass() {
    let hourglass = document.getElementById("hourglass");
    hourglass.classList.remove("hourglass-show");
    return;
}

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

const selectionState = {
    source: null,
    card: null,
    destination: null,
    waiting: true,
    possibleDestinations:[],

    updateSource(newSource) {
        if (this.waiting || gameHistory.active) {
            return;
        }
        if (this.source !== null) {
            getSelectionElement(this.source).className = "selection selection-empty";
        }
        this.source = newSource;
        getSelectionElement(this.source).className = "selection selection-pawn";
        this.updatePossibleDestinations();
    },

    updateCard(newCard) {
        if (this.waiting || gameHistory.active) {
            return;
        }
        if (this.card !== null) {
            this.card.firstElementChild.setAttribute("class", "selection-card-empty");
        }
        this.card = newCard;
        this.card.firstElementChild.setAttribute("class", "selection-card-red");
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
            if (targetPawnElement.className.includes("red")) {
                continue;
            }

            getSelectionElement(targetSpace).className = "selection selection-dest";
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
    if (pawnInfo.includes("red")) {
        selectionState.updateSource(space);
        return;
    }
    else if (selectionState.pawn === null) {
        return;
    }

    if (selectionState.possibleDestinations.includes(space)) {
        selectionState.destination = space;
        selectionState.waiting = true;
        performHumanMove();
    }
}

function clickedCard(e) {
    let card = e.currentTarget
    let id = card.getAttribute("id");
    if (id === "red_card_0" || id === "red_card_1") {
        selectionState.updateCard(card);
    }
}

function AI_settings(e) {
    var AI_settings = {
        playstyle: document.getElementById("AI-settings")["playstyle"],
        depth: document.getElementById("AI-settings")["depth"]
    };
    fetch("/AIsettings/", {
        method: 'POST',
        credentials: 'same-origin',
        headers:{
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': csrftoken,
    },
        body: JSON.stringify(AI_settings) //JavaScript object of data to POST
    })
    .then(response => {
            return
    })
}

function performHumanMove() {
    selectionState.waiting = true;
    var moveInfo = {
        pawn: selectionState.source.id,
        card: selectionState.card.id,
        dest: selectionState.destination.id
    };
    let thisMove = new Move("red", selectionState.source, selectionState.destination, getPawnElement(selectionState.destination).className, selectionState.card);
    gameHistory.moves.push(thisMove);
    gameHistory.position++;
    gameHistory.updateGraphics();

    // update visual aspects
    selectionState.clearGraphics();
    animatePawn(selectionState.source, selectionState.destination);
    animateCard(selectionState.card, getCard("middle_card_0"), true, 0);
    animateCard(getCard("middle_card_1"), selectionState.card, false, .2);


    getCard("middle_card_1").addEventListener("transitionend", function finishHumanMove() {
        selectionState.clear();
        displayHourglass();
        getCard("middle_card_1").removeEventListener("transitionend", finishHumanMove);
        sendToServer(moveInfo);
    });
};

function sendToServer(moveInfo) {
    // send a fetch message to the server with the state
    fetch("/move/", {
        method: 'POST',
        credentials: 'same-origin',
        headers:{
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': csrftoken,
    },
        body: JSON.stringify(moveInfo) //JavaScript object of data to POST
    })
    .then(response => {
            return response.json() //Convert response to JSON
    })
    .then(data => {
        performComputerMove(data);
    })
    return;
};

function performComputerMove(data) {
    removeHourglass();
    if (data["winner"] === "red wins") {
        displayGameEnd("Red Wins!");
        return;
    }

    var sourceSpace = document.getElementById(data["pawn"]);
    var destSpace = document.getElementById(data["dest"]);
    var card = document.getElementById(data["card"]);

    let thisMove = new Move("blue", sourceSpace, destSpace, getPawnElement(destSpace).className, card);
    gameHistory.moves.push(thisMove);
    gameHistory.position++;
    gameHistory.updateGraphics();

    // update visual aspects
    animatePawn(sourceSpace, destSpace);
    animateCard(card, getCard("middle_card_1"), false, 0);
    animateCard(getCard("middle_card_0"), card, true, .2);


    getCard("middle_card_0").addEventListener("transitionend", function finishComputerMove() {
        getCard("middle_card_0").removeEventListener("transitionend", finishComputerMove);
        if (data["winner"] ===  "blue wins") {
            displayGameEnd("Blue Wins!");
            return;
        }

        selectionState.waiting = false;
    });
}

function displayGameEnd(winningMessage) {
    var settingsOverlay = document.createElement("div");
    settingsOverlay.id = "settings-overlay";
    settingsOverlay.style.background = "none";
    document.getElementById("wrapper").appendChild(settingsOverlay);
    var resultsDisplay = document.createElement("form");
    resultsDisplay.classList.add("results");
    settingsOverlay.appendChild(resultsDisplay);
    resultsDisplay.innerHTML = `<h1>${winningMessage}</h1>`;
    var newGame = document.createElement("button");
    newGame.type = "button";
    newGame.classList.add("form-submit-button");
    newGame.innerHTML = "New Game";
    newGame.addEventListener("click", () => {window.location.reload();});
    resultsDisplay.appendChild(newGame);
    document.getElementById("game-history").style.zIndex = "6";
    selectionState.waiting = false;
    return;
}

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
        if (this.color === "red") {
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
        if (this.color === "red") {
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
        }
        this.updateGraphics();
    }

    updateGraphics() {
        if (this.position === 0) {
            document.getElementById("backward").classList.remove("step-able");
        }
        else {
            document.getElementById("backward").classList.add("step-able");
        }
        if (this.position === this.moves.length) {
            document.getElementById("forward").classList.remove("step-able");
        }
        else {
            document.getElementById("forward").classList.add("step-able");
        }
    }
}

var gameHistory = new GameHistory();

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById("forward").onclick = function () {
        gameHistory.stepForward();
    };
    document.getElementById("backward").onclick = function () {
        gameHistory.stepBackward();
    };

    selectionState.waiting = true;
    document.getElementById("AI-settings").addEventListener("submit", (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        var AI_settings = {
            playstyle: formData.get("playstyle"),
            depth: formData.get("depth")
        };
        document.getElementById("settings-overlay").remove()
        fetch("/AIsettings/", {
            method: 'POST',
            credentials: 'same-origin',
            headers:{
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': csrftoken,
        },
            body: JSON.stringify(AI_settings) //JavaScript object of data to POST
        })
        .then(response => {
            start_a_game()
            return
        })
    });

    var board = document.getElementsByClassName("board")[0];
    board.style.backgroundImage = "url(static/images/board-background.png)";

    // create the spaces
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            let space = document.createElement("div");
            space.setAttribute("class", "space");
            space.setAttribute("id", `${i}${j}`);
            space.style.backgroundImage = `url(static/images/spaces/${i}${j}.png`;
            space.onclick = clickedSpace;
            board.appendChild(space);

            let selection_element = document.createElement("div");
            selection_element.classList.add("selection");
            selection_element.classList.add("selection-empty");
            space.appendChild(selection_element);

            let pawn_element = document.createElement("div");
            pawn_element.classList.add("pawn");
            pawn_element.classList.add("pawn-empty");
            space.appendChild(pawn_element);
        }
    }


    // create the blue pieces
    for (let i = 0; i < 5; i++) {
        let space = document.getElementById(`0${i}`);
        if (i == 2) {
            space.querySelector(".pawn").classList.remove("pawn-empty");
            space.querySelector(".pawn").classList.add("pawn-blue-master");
            var blue_temple = document.createElement("div");
            blue_temple.classList.add("blue-temple");
            space.appendChild(blue_temple);
        }
        else {
            space.querySelector(".pawn").classList.remove("pawn-empty");
            space.querySelector(".pawn").classList.add("pawn-blue-normal");
        }
    }

    // create the red pieces
    for (let i = 0; i < 5; i++) {
        let space = document.getElementById(`4${i}`);
        if (i == 2) {
            space.querySelector(".pawn").classList.remove("pawn-empty");
            space.querySelector(".pawn").classList.add("pawn-red-master");
            var red_temple = document.createElement("div");
            red_temple.classList.add("red-temple");
            space.appendChild(red_temple);
        }
        else {
            space.querySelector(".pawn").classList.remove("pawn-empty");
            space.querySelector(".pawn").classList.add("pawn-red-normal");
        }
    }
});

// build the board, spaces, and fill the cards
function start_a_game() {
    var board = document.getElementsByClassName("board")[0];

    // create the cards
    getCard("blue_card_0").style.backgroundImage = "url(static/images/cards/" + deck[0].name + ".png)";
    getCard("blue_card_1").style.backgroundImage = "url(static/images/cards/" + deck[1].name + ".png)";
    getCard("red_card_0").style.backgroundImage = "url(static/images/cards/" + deck[2].name + ".png)";
    getCard("red_card_1").style.backgroundImage = "url(static/images/cards/" + deck[3].name + ".png)";

    if (deck[4].startingColor === "red") {
        getCard("middle_card_0").style.backgroundImage = "url(static/images/cards/blank.png)";
        getCard("middle_card_1").style.backgroundImage = "url(static/images/cards/" + deck[4].name + ".png)";
    }
    else {
        // getCard("middle_card_1").style.backgroundImage = "url(static/images/cards/blue-hourglass.png)";
        displayHourglass();
        getCard("middle_card_0").style.backgroundImage = "url(static/images/cards/" + deck[4].name + ".png)";
    }

    let cards = document.getElementsByClassName("card");
    for (let i = 0; i < cards.length; i++) {
        cards[i].onclick = clickedCard;
    }

    // build the underlying python model
    var setup_info = {
        blue_card_0: deck[0].name,
        blue_card_1: deck[1].name,
        red_card_0: deck[2].name,
        red_card_1: deck[3].name,
        middle_card: deck[4].name
    }
    fetch("/setup/", {
        method: 'POST',
        credentials: 'same-origin',
        headers:{
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': csrftoken,
    },
        body: JSON.stringify(setup_info) //JavaScript object of data to POST
    })
    .then(response => {
        return response.json();
    })
    .then(data => {
        if (data["pawn"] === "None") {
            selectionState.waiting = false;
            return;
        }
        performComputerMove(data);
        
        return;
    })
};