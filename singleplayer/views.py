from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
import json
from .game import game_state
from .game import move as onitama_move
from .game import minimax
from django import forms

playstyle_dictionary = {
    "defensive": minimax.evaluation,
    "balanced": minimax.evaluation2,
    "aggressive": minimax.evaluation3
}

# Create your views here.
def index(request):
    return render(request, "singleplayer/index.html")

# https://www.brennantymrak.com/articles/fetching-data-with-ajax-and-django
def user_move(request):
    json_game = request.session['game_state']
    back_end_game = game_state.Game_state(json_game, setup=False)
    global game_structure
    move_data = json.load(request)
    # move_data example: {'pawn': '(4,3)', 'card': 'red_card_0', 'dest': '(3,4)'}
    dest_row = int(move_data['dest'][1])
    dest_column = int(move_data['dest'][3])
    pawn_row = int(move_data['pawn'][1])
    pawn_column = int(move_data['pawn'][3])
    card_index = int(move_data['card'][-1])
    card = back_end_game.red_player.hand[card_index]
    movement_index = card.get_movement_index((pawn_row, pawn_column), (dest_row, dest_column))

    user_move = onitama_move.Move(pawn_row, pawn_column, card_index, movement_index)

    user_move.perform_move(back_end_game, back_end_game.red_player)
    request.session['game_state'] = back_end_game.to_dict()

    if back_end_game.game_is_over():
        game_over_dict = {'winner': back_end_game.game_is_over()}
        return JsonResponse(game_over_dict)

    computer_move = minimax.alpha_beta_cutoff_search(
        back_end_game,
        minimax.Onitama(),
        d=request.session["depth"],
        eval_fn=playstyle_dictionary[request.session["playstyle"]]
    )
    movement_tuple = back_end_game.blue_player.hand[computer_move.card_index].movement[computer_move.movement_index]

    # move_data example: {'pawn': '(4,3)', 'card': 'red_card_0', 'dest': '(3,4)'}\
    computer_move_dict = {
        'winner': 'None',
        'pawn': (computer_move.piece_row,computer_move.piece_column),
        'card': 'blue_card_' + str(computer_move.card_index),
        'dest': (computer_move.piece_row - movement_tuple[0],computer_move.piece_column - movement_tuple[1])
    }

    computer_move.perform_move(back_end_game, back_end_game.blue_player)
    request.session['game_state'] = back_end_game.to_dict()

    if back_end_game.game_is_over():
        computer_move_dict['winner'] = back_end_game.game_is_over()

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
    # {'blue_card_0': 'crane', 
    #  'blue_card_1': 'turtle', 
    #  'red_card_0': 'dragon', 
    #  'red_card_1': 'rooster', 
    #  'middle_card': 'ram'}
    back_end_game = game_state.Game_state(setup_data, setup=True)

    if back_end_game.current_player == back_end_game.blue_player:
        computer_move = minimax.alpha_beta_cutoff_search(
            back_end_game,
            minimax.Onitama(),
            d=request.session["depth"],
            eval_fn=playstyle_dictionary[request.session["playstyle"]]
        )
        movement_tuple = back_end_game.blue_player.hand[computer_move.card_index].movement[computer_move.movement_index]
        computer_move_dict = {
            'pawn': (computer_move.piece_row,computer_move.piece_column),
            'card': 'blue_card_' + str(computer_move.card_index),
            'dest': (computer_move.piece_row - movement_tuple[0],computer_move.piece_column - movement_tuple[1])
        }
        computer_move.perform_move(back_end_game, back_end_game.blue_player)
        request.session['game_state'] = back_end_game.to_dict()
        return JsonResponse(computer_move_dict)

    empty_dict = {'pawn': 'None'}
    request.session['game_state'] = back_end_game.to_dict()
    return JsonResponse(empty_dict)