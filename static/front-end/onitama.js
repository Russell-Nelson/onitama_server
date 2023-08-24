
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
        var card = get_card_by_bg_image(state.clicked_card.style.backgroundImage);

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
        this.clear_selections();
        this.clicked_pawn = null;
        this.clicked_card = null;
        this.clicked_dest = null;
        this.update_possible_destinations();
    },

    clear_selections() {
        this.possible_destinations.forEach(function (e) {
            e.querySelector(".selection").className = "selection selection-empty";
        });
        this.clicked_pawn.querySelector(".selection").className = "selection selection-empty";
        this.clicked_card.firstElementChild.setAttribute("class", "selection-card-empty");
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
        perform_red_move();
    }
}

function clicked_card(e) {
    let card = e.currentTarget
    let id = card.getAttribute("id");
    if (id === "red_card_0" || id === "red_card_1") {
        state.update_clicked_card(card);
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

function perform_red_move() {
    var move_info = {
        pawn: state.clicked_pawn.getAttribute("id"),
        card: state.clicked_card.getAttribute("id"),
        dest: state.clicked_dest.getAttribute("id")
    };

    // start pawn animation
    var sourceRect = state.clicked_pawn.querySelector(".pawn").getBoundingClientRect();
    var destRect = state.clicked_dest.querySelector(".pawn").getBoundingClientRect();
    var dx = destRect.x - sourceRect.x;
    var dy = destRect.y - sourceRect.y;
    state.clicked_pawn.querySelector(".pawn").style.zIndex = "3";
    state.clicked_pawn.querySelector(".pawn").style.transition = "transform 0.2s ease-out 0s";
    state.clicked_pawn.querySelector(".pawn").style.transform = `translate(${dx}px, ${dy}px)`;

    // start card animation
    var sourceRect = state.clicked_card.getBoundingClientRect();
    var destRect = document.getElementById("middle_card_0").getBoundingClientRect();
    var dx = destRect.x - sourceRect.x;
    var dy = destRect.y - sourceRect.y;
    state.clicked_card.style.transition = "transform 0.5s ease-out 0s";
    state.clicked_card.style.transform = `matrix(-1, 0, 0, -1, ${dx}, ${dy})`;

    // fill in empty card slot
    var sourceRect = document.getElementById("middle_card_1").getBoundingClientRect();
    var destRect = state.clicked_card.getBoundingClientRect();
    var dx = destRect.x - sourceRect.x;
    var dy = destRect.y - sourceRect.y;
    document.getElementById("middle_card_1").style.zIndex = "5";
    document.getElementById("middle_card_1").style.transition = "transform 0.5s ease-out 0.2s";
    document.getElementById("middle_card_1").style.transform = `matrix(1, 0, 0, 1, ${dx}, ${dy})`;
    state.clear_selections();

    document.getElementById("middle_card_1").addEventListener("transitionend", function handle_red_move() {
        state.clicked_card.style.transition = "none";
        state.clicked_card.style.transform = "none";
        state.clicked_pawn.querySelector(".pawn").style.zIndex = "2";
        state.clicked_pawn.querySelector(".pawn").style.transition = "none";
        state.clicked_pawn.querySelector(".pawn").style.transform = "none";
        document.getElementById("middle_card_1").style.zIndex = "3";
        document.getElementById("middle_card_1").style.transition = "none";
        document.getElementById("middle_card_1").style.transform = "none";

        // update dom structure for the pawn
        var source_class = state.clicked_pawn.querySelector(".pawn").getAttribute("class");
        state.clicked_dest.querySelector(".pawn").className = source_class;
        state.clicked_pawn.querySelector(".pawn").className = "pawn pawn-empty";

        // update dom structure for the cards
        document.getElementById("middle_card_0").style.backgroundImage = state.clicked_card.style.backgroundImage;
        document.getElementById("middle_card_0").style.transform= "rotate(180deg)";

        state.clicked_card.style.backgroundImage = document.getElementById("middle_card_1").style.backgroundImage;
        document.getElementById("middle_card_1").style.backgroundImage = "url(static/images/cards/blue-hourglass.png)";
        document.getElementById("middle_card_1").classList.add("fade-in");

        document.getElementById("middle_card_1").removeEventListener("transitionend", handle_red_move);

        state.clear_state();

        send_to_server(move_info);

    });
    
    return;
}

function send_to_server(move_info) {
    // send a fetch message to the server with the state
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
        perform_blue_move(data);
    })
    return;
}

function perform_blue_move(data) {
    //Perform actions with the response data from the view
    if (data['winner'] === "red wins") {
        var settings_overlay = document.createElement("div");
        settings_overlay.id = "settings-overlay";
        settings_overlay.style.background = "none";
        document.querySelector("body").appendChild(settings_overlay);
        var results_display = document.createElement("form");
        results_display.classList.add("results");
        settings_overlay.appendChild(results_display);
        results_display.innerHTML = "<h1>Red Wins!</h1>";
        var new_game = document.createElement("button");
        new_game.type = "button";
        new_game.classList.add("form-submit-button");
        new_game.innerHTML = "New Game";
        new_game.addEventListener("click", () => {window.location.reload();});
        results_display.appendChild(new_game);
        return;
    }

    var pawn_id = "(" + data["pawn"][0].toString() + "," + data["pawn"][1].toString() + ")";
    var dest_id = "(" + data["dest"][0].toString() + "," + data["dest"][1].toString() + ")";
    var card_id = data["card"];

    var moved_pawn_space = document.getElementById(pawn_id);
    var dest_space = document.getElementById(dest_id);
    var moved_card = document.getElementById(card_id);

    // clear the hourglass
    document.getElementById("middle_card_1").classList.remove("fade-in");
    document.getElementById("middle_card_1").classList.add("fade-out");

    // start pawn animation
    var sourceRect = moved_pawn_space.querySelector(".pawn").getBoundingClientRect();
    var destRect = dest_space.querySelector(".pawn").getBoundingClientRect();
    var dx = destRect.x - sourceRect.x;
    var dy = destRect.y - sourceRect.y;
    moved_pawn_space.querySelector(".pawn").style.zIndex = "3";
    moved_pawn_space.querySelector(".pawn").style.transition = "transform 0.2s ease-out 0s";
    moved_pawn_space.querySelector(".pawn").style.transform = `translate(${dx}px, ${dy}px)`;

    // start card animation
    var sourceRect = moved_card.getBoundingClientRect();
    var destRect = document.getElementById("middle_card_1").getBoundingClientRect();
    var dx = destRect.x - sourceRect.x;
    var dy = destRect.y - sourceRect.y;
    moved_card.style.transition = "transform 0.5s ease-out 0s";
    moved_card.style.transform = `matrix(1, 0, 0, 1, ${dx}, ${dy})`;


    // fill in empty card slot
    var sourceRect = document.getElementById("middle_card_0").getBoundingClientRect();
    var destRect = moved_card.getBoundingClientRect();
    var dx = destRect.x - sourceRect.x;
    var dy = destRect.y - sourceRect.y;
    document.getElementById("middle_card_0").style.zIndex = "5";
    document.getElementById("middle_card_0").style.transition = "transform 0.5s ease-out 0.2s";
    document.getElementById("middle_card_0").style.transform = `matrix(-1, 0, 0, -1, ${dx}, ${dy})`;

    document.getElementById("middle_card_0").addEventListener("transitionend", function handle_blue_move() {
        document.getElementById("middle_card_1").classList.remove("fade-out");
        moved_card.style.transition = "transform 0s linear 0s";
        moved_card.style.transform = "none";
        moved_pawn_space.querySelector(".pawn").style.zIndex = "2";
        moved_pawn_space.querySelector(".pawn").style.transition = "transform 0s linear 0s";
        moved_pawn_space.querySelector(".pawn").style.transform = "none";
        document.getElementById("middle_card_0").style.zIndex = "3";
        document.getElementById("middle_card_0").style.transition = "transform 0s linear 0s";
        document.getElementById("middle_card_0").style.transform = "none";

        // update dom structure for the pawn
        var pawn_class = moved_pawn_space.querySelector(".pawn").getAttribute("class");
        dest_space.querySelector(".pawn").className = pawn_class;
        moved_pawn_space.querySelector(".pawn").className = "pawn pawn-empty";


        // update dom structure for the cards
        document.getElementById("middle_card_1").style.backgroundImage = moved_card.style.backgroundImage;
        moved_card.style.backgroundImage = document.getElementById("middle_card_0").style.backgroundImage;
        moved_card.style.transform = "rotate(180deg)";
        document.getElementById("middle_card_0").style.backgroundImage = "url(static/images/cards/blank.png)";

        document.getElementById("middle_card_0").removeEventListener("transitionend", handle_blue_move);

        if (data['winner'] === "blue wins") {
            var settings_overlay = document.createElement("div");
            settings_overlay.id = "settings-overlay";
            settings_overlay.style.background = "none";
            document.querySelector("body").appendChild(settings_overlay);
            var results_display = document.createElement("form");
            results_display.classList.add("results");
            settings_overlay.appendChild(results_display);
            results_display.innerHTML = "<h1>Blue Wins!</h1>";
            var new_game = document.createElement("button");
            new_game.type = "button";
            new_game.classList.add("form-submit-button");
            new_game.innerHTML = "New Game";
            new_game.addEventListener("click", () => {window.location.reload();});
            results_display.appendChild(new_game);
        }
        state.waiting = false;
    })
    return;
}

function perform_move() {
    var move_info = {
        pawn: state.clicked_pawn.getAttribute("id"),
        card: state.clicked_card.getAttribute("id"),
        dest: state.clicked_dest.getAttribute("id")
    };

    var sourceRect = state.clicked_pawn.querySelector(".pawn").getBoundingClientRect();
    var destRect = state.clicked_dest.querySelector(".pawn").getBoundingClientRect();
    var dx = destRect.x - sourceRect.x;
    var dy = destRect.y - sourceRect.y;
    state.clicked_pawn.querySelector(".pawn").addEventListener("transitionend", (event) => {
        // move the piece
        var source_class = state.clicked_pawn.querySelector(".pawn").getAttribute("class");
        state.clicked_dest.querySelector(".pawn").className = source_class;
        state.clicked_pawn.querySelector(".pawn").className = "pawn pawn-empty";
    });
    state.clicked_pawn.querySelector(".pawn").style.transition = "transform 0.2s ease-out 0s";
    state.clicked_pawn.querySelector(".pawn").style.transform = `translate(${dx}px, ${dy}px)`;

    
    var sourceRect = state.clicked_card.getBoundingClientRect();
    var destRect = document.getElementById("middle_card_0").getBoundingClientRect();
    var dx = destRect.x - sourceRect.x;
    var dy = destRect.y - sourceRect.y;
    state.clicked_card.addEventListener("transitionend", (event) => {
        // move the cards
        document.getElementById("middle_card_0").style.backgroundImage = state.clicked_card.style.backgroundImage;
        state.clicked_card.style.backgroundImage = document.getElementById("middle_card_1").style.backgroundImage;
        document.getElementById("middle_card_1").style.backgroundImage = "url(static/images/cards/blue-hourglass.png)";
    });
    state.clicked_card.style.transition = "transform 0.3s ease-out 0s";
    state.clicked_card.style.transform = `matrix(-1, 0, 0, -1, ${dx}, ${dy})`;

    // send a fetch message to the server with the state
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

document.addEventListener('DOMContentLoaded', () => {
    state.waiting = true;
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
});

// build the board, spaces, and fill the cards
function start_a_game() {
    var board = document.getElementsByClassName("board")[0];

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
            state.waiting = false;
            return
        }
        perform_blue_move(data);
        
        return
    })
};