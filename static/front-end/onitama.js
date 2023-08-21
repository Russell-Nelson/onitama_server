// make all sizes percentage/proportion based
// add UI for when the server is computing
// improve UI for the end of the game
// add drop shadows to the cards
// fix the scaling of the background paper (load time)
// update all textures for the new scaling fixes

// add a setup page for depth
// add animations to the pieces
// add a tutorial mode

// PROBLEMS:
// having multiple tabs open within the same browser is a problem


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


const state = {
    clicked_pawn: null,
    clicked_card: null,
    clicked_dest: null,
    waiting: false,
    possible_destinations:[],

    update_clicked_pawn(pawn) {
        if (this.waiting) {
            return;
        }
        if (this.clicked_pawn !== null) {
            this.clicked_pawn.querySelector(".selection").className = "selection selection-empty";
        }
        this.clicked_pawn = pawn;
        this.clicked_pawn.querySelector(".selection").className =  "selection selection-pawn";
        this.update_possible_destinations();
    },

    update_clicked_card(card) {
        if (this.waiting) {
            return;
        }
        if (this.clicked_card !== null) {
            this.clicked_card.firstElementChild.setAttribute("class", "selection-card-empty");
        }
        this.clicked_card = card;
        this.clicked_card.firstElementChild.setAttribute("class", "selection-card-red");
        this.update_possible_destinations();
    },

    update_possible_destinations() {
        this.possible_destinations.forEach(function (e) {
            e.querySelector(".selection").className = "selection selection-empty";
        });
        this.possible_destinations = [];
        if (this.clicked_pawn === null || this.clicked_card === null) {
            return;
        }
        var card = get_card_by_bg_image(state.clicked_card.getAttribute("style"));

        var pos = [parseInt(this.clicked_pawn.getAttribute("id")[1]), parseInt(this.clicked_pawn.getAttribute("id")[3])];

        for (let i = 0; i < card.movement_count; i++) {
            var target = [pos[0] + card.movements[i][0], pos[1] + card.movements[i][1]];
            
            if (target[0] > 4 || target[0] < 0) continue;
            if (target[1] > 4 || target[1] < 0) continue;

            var target_space = document.getElementById(`(${target[0]},${target[1]})`);
            var target_pawn_class = target_space.querySelector(".pawn").className;
            if (target_pawn_class.includes("red")) {
                continue;
            }

            target_space.querySelector(".selection").className = "selection selection-dest";
            this.possible_destinations.push(target_space);
        }        
    },

    clear_state() {
        this.clicked_pawn.querySelector(".selection").className = "selection selection-empty";
        this.clicked_pawn = null;
        this.clicked_card.firstElementChild.setAttribute("class", "selection-card-empty");
        this.clicked_card = null;
        this.clicked_dest = null;
        this.update_possible_destinations();
    }
}

function clicked_space(e) {
    let space = e.currentTarget;
    let space_pawn_info = space.querySelector(".pawn").className;
    if (space_pawn_info.includes("red")) {
        state.update_clicked_pawn(space);
        return;
    }
    else if (state.clicked_pawn === null) {
        return;
    }

    if (state.possible_destinations.includes(space)) {
        state.clicked_dest = space;
        state.waiting = true;
        perform_move();
    }
}

function clicked_card(e) {
    let card = e.currentTarget
    let id = card.getAttribute("id");
    if (id === "red_card_0" || id === "red_card_1") {
        state.update_clicked_card(card);
    }
}

function perform_move() {
    console.log(state.waiting);
    // var sourceRect = state.clicked_pawn.querySelector(".pawn").getBoundingClientRect();
    // var destRect = state.clicked_dest.querySelector(".pawn").getBoundingClientRect();
    // var dx = destRect.x - sourceRect.x;
    // var dy = destRect.y - sourceRect.y;
    // state.clicked_pawn.querySelector(".pawn").style.transition = "transform 0.2s linear 0s";
    // state.clicked_pawn.querySelector(".pawn").style.transform = `translate(${dx}px, ${dy}px)`;

    // move the piece
    var source_class = state.clicked_pawn.querySelector(".pawn").getAttribute("class");
    state.clicked_dest.querySelector(".pawn").className = source_class;
    state.clicked_pawn.querySelector(".pawn").className = "pawn pawn-empty";

    // let element2 = state.clicked_dest.querySelector(".pawn");
    // var rect = element2.getBoundingClientRect();
    // console.log("New position: ")
    // console.log(rect.x + window.scrollX);
    // console.log(rect.y + window.scrollY);

    // move the cards
    document.getElementById("middle_card_0").style.backgroundImage = state.clicked_card.style.backgroundImage;
    state.clicked_card.style.backgroundImage = document.getElementById("middle_card_1").style.backgroundImage;
    document.getElementById("middle_card_1").style.backgroundImage = "url(static/images/cards/blue-hourglass.png)";

    // send a fetch message to the server with the state
    var move_info = {
        pawn: state.clicked_pawn.getAttribute("id"),
        card: state.clicked_card.getAttribute("id"),
        dest: state.clicked_dest.getAttribute("id")
    };
    fetch("/move/", {
        method: 'POST',
        credentials: 'same-origin',
        headers:{
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': csrftoken,
    },
        body: JSON.stringify(move_info) //JavaScript object of data to POST
    })
    .then(response => {
            return response.json() //Convert response to JSON
    })
    .then(data => {
        //Perform actions with the response data from the view
        if (data['winner'] === "red wins") {
            alert("Red wins!");
            return;
        }
        var pawn_id = "(" + data["pawn"][0].toString() + "," + data["pawn"][1].toString() + ")";
        var dest_id = "(" + data["dest"][0].toString() + "," + data["dest"][1].toString() + ")";
        var card_id = data["card"];

        var moved_pawn_space = document.getElementById(pawn_id);
        var dest_space = document.getElementById(dest_id);

        var pawn_class = moved_pawn_space.querySelector(".pawn").getAttribute("class");
        dest_space.querySelector(".pawn").className = pawn_class;
        moved_pawn_space.querySelector(".pawn").className = "pawn pawn-empty";

        var moved_card = document.getElementById(card_id);
        document.getElementById("middle_card_1").style.backgroundImage = moved_card.style.backgroundImage;
        moved_card.style.backgroundImage = document.getElementById("middle_card_0").style.backgroundImage;
        document.getElementById("middle_card_0").style.backgroundImage = "url(static/images/cards/blank.png)";

        if (data['winner'] === "blue wins") {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    alert("Blue wins!");
                });
            });
            return;
        }
        
        state.waiting = false;
        return;
    })

    state.clear_state();
    return;
}

// build the board, spaces, and fill the cards
document.addEventListener('DOMContentLoaded', () => {
    var board = document.getElementsByClassName("board")[0];

    // create the spaces
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            let space = document.createElement("div");
            space.setAttribute("class", "space");
            space.setAttribute("id", `(${i},${j})`);
            space.style.backgroundImage = `url(static/images/spaces/${i}${j}.png`;
            space.onclick = clicked_space;
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

    // add the blue and red temple marks
    let blue_temple_space = document.getElementById("(0,2)");
    let blue_temple = document.createElement("div");
    blue_temple.setAttribute("class", "blue-temple");
    blue_temple_space.appendChild(blue_temple);

    let red_temple_space = document.getElementById("(4,2)");
    let red_temple = document.createElement("div");
    red_temple.setAttribute("class", "red-temple");
    red_temple_space.appendChild(red_temple);


    // create the blue pieces
    for (let i = 0; i < 5; i++) {
        let space = document.getElementById(`(0,${i})`);
        if (i == 2) {
            space.querySelector(".pawn").classList.remove("pawn-empty");
            space.querySelector(".pawn").classList.add("pawn-blue-master");
        }
        else {
            space.querySelector(".pawn").classList.remove("pawn-empty");
            space.querySelector(".pawn").classList.add("pawn-blue-normal");
        }
    }

    // create the red pieces
    for (let i = 0; i < 5; i++) {
        let space = document.getElementById(`(4,${i})`);
        if (i == 2) {
            space.querySelector(".pawn").classList.remove("pawn-empty");
            space.querySelector(".pawn").classList.add("pawn-red-master");
        }
        else {
            space.querySelector(".pawn").classList.remove("pawn-empty");
            space.querySelector(".pawn").classList.add("pawn-red-normal");
        }
    }

    // create the cards
    document.getElementById("blue_card_0").style.backgroundImage = "url(static/images/cards/" + deck[0].name + ".png)";
    document.getElementById("blue_card_1").style.backgroundImage = "url(static/images/cards/" + deck[1].name + ".png)";
    document.getElementById("red_card_0").style.backgroundImage = "url(static/images/cards/" + deck[2].name + ".png)";
    document.getElementById("red_card_1").style.backgroundImage = "url(static/images/cards/" + deck[3].name + ".png)";

    if (deck[4].starting_color === "red") {
        document.getElementById("middle_card_0").style.backgroundImage = "url(static/images/cards/blank.png)";
        document.getElementById("middle_card_1").style.backgroundImage = "url(static/images/cards/" + deck[4].name + ".png)";
    }
    else {
        document.getElementById("middle_card_1").style.backgroundImage = "url(static/images/cards/blue-hourglass.png)";
        document.getElementById("middle_card_0").style.backgroundImage = "url(static/images/cards/" + deck[4].name + ".png)";
    }

    let cards = document.getElementsByClassName("card");
    for (let i = 0; i < cards.length; i++) {
        cards[i].onclick = clicked_card;
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
            return
        }
        //Perform actions with the response data from the view
        var pawn_id = "(" + data["pawn"][0].toString() + "," + data["pawn"][1].toString() + ")";
        var dest_id = "(" + data["dest"][0].toString() + "," + data["dest"][1].toString() + ")";
        var card_id = data["card"];

        var moved_pawn_space = document.getElementById(pawn_id);
        var dest_space = document.getElementById(dest_id);

        var pawn_class = moved_pawn_space.querySelector(".pawn").getAttribute("class");
        dest_space.querySelector(".pawn").className = pawn_class;
        moved_pawn_space.querySelector(".pawn").className = "pawn pawn-empty";

        var moved_card = document.getElementById(card_id);
        document.getElementById("middle_card_1").style.backgroundImage = moved_card.style.backgroundImage;
        moved_card.style.backgroundImage = document.getElementById("middle_card_0").style.backgroundImage;
        document.getElementById("middle_card_0").style.backgroundImage = "url(static/images/cards/blank.png)";

        
        return
    })
});