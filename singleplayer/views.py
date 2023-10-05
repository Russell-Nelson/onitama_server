# // PROBLEMS:
# // having multiple tabs open within the same browser is a problem

# // WHAT IS NEXT?
# // when capturing a piece, the piece getting removed should look more graceful
# // add sound for captures
# // put more work into the evaluation functions
# // work on the display for mobile
# // work on scaling the display in general
# // add a tutorial mode
# // add drop shadows to the cards
# // animate the hourglass dots


from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
import json
from .game import game_state
from .game import move as onitama_move
from .game import minimax
import time
import random

playstyle_dictionary = {
    "defensive": minimax.defensive_evaluation,
    "balanced": minimax.balanced_evaluation,
    "aggressive": minimax.aggressive_evaluation
}

# Create your views here.
def home(request):
    return render(request, "singleplayer/home.html")

def game(request):
    # TODO: add random colors
    # colors = ["red", "blue"]
    # user_color = random.choice(colors)
    # colors.remove(user_color)
    # opponent_color = colors[0]
    user_color = "red"
    opponent_color = "blue"
    username = "Anonymous"
    rating = "-"
    if request.user.is_authenticated:
        username = request.user.username
        rating = request.user.rating
    return render(request, "singleplayer/singleplayer-game.html", {
        "user_color": user_color,
        "opponent_color": opponent_color,
        "username": username,
        "rating": rating,
    })

# https://www.brennantymrak.com/articles/fetching-data-with-ajax-and-django
def user_move(request):
    json_game = request.session['game_state']
    back_end_game = game_state.Game_state(json_game, setup=False)
    global game_structure
    move_data = json.load(request)
    # move_data example: {'pawn': '43', 'card': 'red_card_0', 'dest': '34'}
    # new move_data example {'color': 'red', source: '43', 'target': '34', 'cardIndex': 0}
    dest_row = int(move_data['target'][0])
    dest_column = int(move_data['target'][1])
    pawn_row = int(move_data['source'][0])
    pawn_column = int(move_data['source'][1])
    card_index = int(move_data['cardIndex'])
    card = back_end_game.red_player.hand[card_index]
    movement_index = card.get_movement_index((pawn_row, pawn_column), (dest_row, dest_column))

    user_move = onitama_move.Move(pawn_row, pawn_column, card_index, movement_index)

    user_move.perform_move(back_end_game, back_end_game.red_player)
    request.session['game_state'] = back_end_game.to_dict()

    if back_end_game.game_is_over():
        game_over_dict = {'color': "game over"}
        return JsonResponse(game_over_dict)
    
    # start timer
    start = time.time()

    computer_move = minimax.alpha_beta_cutoff_search(
        back_end_game,
        minimax.Onitama(),
        d=request.session["depth"],
        eval_fn=playstyle_dictionary[request.session["playstyle"]]
    )
    movement_tuple = back_end_game.blue_player.hand[computer_move.card_index].movement[computer_move.movement_index]

    # move_data example: {'pawn': '43', 'card': 'red_card_0', 'dest': '34'}\
    computer_move_dict = {
        'winner': 'None',
        'color': 'blue',
        'source': str(computer_move.piece_row) + str(computer_move.piece_column),
        'cardIndex': str(computer_move.card_index),
        'target': str(computer_move.piece_row - movement_tuple[0]) + str(computer_move.piece_column - movement_tuple[1])
    }

    computer_move.perform_move(back_end_game, back_end_game.blue_player)
    request.session['game_state'] = back_end_game.to_dict()

    # SHOULDNT NEED THIS ANYMORE
    # if back_end_game.game_is_over():
    #     computer_move_dict['winner'] = back_end_game.game_is_over()

    # check timer
    time_elapsed = time.time() - start
    if time_elapsed < 4:
        time.sleep(4 - time_elapsed)
    return JsonResponse(computer_move_dict)

def AIsettings(request):
    AI_settings = json.load(request)
    playstyle = AI_settings["playstyle"]
    if playstyle not in ["defensive", "balanced", "aggressive"]:
        return JsonResponse({"AI_setting_status": "INVALID"})
    depth = int(AI_settings["depth"])
    if depth not in [1, 2, 3, 4]:
        return JsonResponse({"AI_setting_status": "INVALID"})
    request.session["playstyle"] = playstyle
    request.session["depth"] = depth
    return JsonResponse({"AI_setting_status": "OK"})


def setup(request):
    setup_data = json.load(request)
    # setup_data example: 
    # {'userColor': 'blue',
    #  'owner_card_0': 'crane', 
    #  'owner_card_1': 'turtle', 
    #  'opponent_card_0': 'dragon', 
    #  'opponent_card_1': 'rooster', 
    #  'middle_card': 'ram'}
    back_end_game = game_state.Game_state(setup_data, setup=True)

    if back_end_game.current_player == back_end_game.blue_player:
        start = time.time()
        computer_move = minimax.alpha_beta_cutoff_search(
            back_end_game,
            minimax.Onitama(),
            d=request.session["depth"],
            eval_fn=playstyle_dictionary[request.session["playstyle"]]
        )
        movement_tuple = back_end_game.blue_player.hand[computer_move.card_index].movement[computer_move.movement_index]
        computer_move_dict = {
            'color': 'blue',
            'source': str(computer_move.piece_row) + str(computer_move.piece_column),
            'cardIndex': str(computer_move.card_index),
            'target': str(computer_move.piece_row - movement_tuple[0]) + str(computer_move.piece_column - movement_tuple[1])
        }
        computer_move.perform_move(back_end_game, back_end_game.blue_player)
        request.session['game_state'] = back_end_game.to_dict()
        time_elapsed = time.time() - start
        if time_elapsed < 3:
            time.sleep(3 - time_elapsed)
        return JsonResponse(computer_move_dict)

    empty_dict = {'pawn': 'None'}
    request.session['game_state'] = back_end_game.to_dict()
    return JsonResponse(empty_dict)