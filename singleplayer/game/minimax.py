import numpy as np
import random
import copy
from .move import Move
# from game_state import Game_state

# TODO: Delete this if everything works
# class Game:
#     """A game is similar to a problem, but it has a utility for each
#     state and a terminal test instead of a path cost and a goal
#     test. To create a game, subclass this class and implement actions,
#     result, utility, and terminal_test. You may override display and
#     successors or you can inherit their default methods. You will also
#     need to set the .initial attribute to the initial state; this can
#     be done in the constructor."""

#     def actions(self, state):
#         """Return a list of the allowable moves at this point."""
#         raise NotImplementedError

#     def result(self, state, move):
#         """Return the state that results from making a move from a state."""
#         raise NotImplementedError

#     def utility(self, state, player):
#         """Return the value of this final state to player."""
#         raise NotImplementedError

#     def terminal_test(self, state):
#         """Return True if this is a final state for the game."""
#         return not self.actions(state)

#     def to_move(self, state):
#         """Return the player whose move it is in this state."""
#         return state.to_move

#     def display(self, state):
#         """Print or otherwise display the state."""
#         print(state)

#     def __repr__(self):
#         return '<{}>'.format(self.__class__.__name__)

#     def play_game(self, *players):
#         """Play an n-person, move-alternating game."""
#         state = self.initial
#         while True:
#             for player in players:
#                 move = player(self, state)
#                 state = self.result(state, move)
#                 if self.terminal_test(state):
#                     self.display(state)
#                     return self.utility(state, self.to_move(self.initial))

# This class is based around the Game class from the public repo of code for the book "Artificial Intelligence: A Modern Approach"
# https://github.com/aimacode
class Onitama:
    """A game is similar to a problem, but it has a utility for each
    state and a terminal test instead of a path cost and a goal
    test. To create a game, subclass this class and implement actions,
    result, utility, and terminal_test. You may override display and
    successors or you can inherit their default methods. You will also
    need to set the .initial attribute to the initial state; this can
    be done in the constructor."""

    def actions(self, state):
        """Return a list of the allowable moves at this point."""
        allowable_moves = []
        player = state.current_player
        for pawn in player.pawns:
            for c in range(2):
                for m in range(len(player.hand[c].movement)):
                    move = Move(pawn.coordinates[0], pawn.coordinates[1], c, m)
                    if move.is_valid(state, player):
                        allowable_moves.append(move)
        return allowable_moves

    def result(self, state, move):
        """Return the state that results from making a move from a state."""
        new_state = copy.deepcopy(state)
        move.perform_move(new_state, new_state.current_player)
        return new_state

    def utility(self, state, player):
        """Return the value of this final state to player."""
        # TODO: check how this is used in minimax
        if (player.color == "blue"):
            if (state.game_is_over() == "blue wins"):
                return np.inf
            else:
                return -np.inf
        else:
            if (state.game_is_over() == "red wins"):
                return np.inf
            else:
                return -np.inf

    def terminal_test(self, state):
        """Return True if this is a final state for the game."""
        if not state.game_is_over():
            return False
        else:
            return True

    def to_move(self, state):
        """Return the player whose move it is in this state."""
        return state.current_player

    def display(self, state):
        """Print or otherwise display the state."""
        state.print_game_state()

    def __repr__(self):
        return '<{}>'.format(self.__class__.__name__)

    def play_game(self, *players):
        """Play an n-person, move-alternating game."""
        state = self.initial
        while True:
            for player in players:
                move = player(self, state)
                state = self.result(state, move)
                if self.terminal_test(state):
                    self.display(state)
                    return self.utility(state, self.to_move(self.initial))
            

def random_player(state):
    """A player that chooses a legal move at random."""
    game_structure = Onitama()
    return random.choice(game_structure.actions(state)) if game_structure.actions(state) else None

# blue winning gives a higher positive value
def evaluation(state):
    eval = 0
    eval += len(state.blue_player.pawns) - len(state.red_player.pawns)
    return eval

def evaluation2(state):
    if (state.game_is_over() == "blue wins"):
        return 10
    elif (state.game_is_over() == "red wins"):
        return -10
    else:
        return len(state.blue_player.pawns) - len(state.red_player.pawns)

def evaluation3(state):
    if (state.game_is_over() == "blue wins"):
        return 10
    elif (state.game_is_over() == "red wins"):
        return -10
    else:
        ret_value = len(state.blue_player.pawns) - len(state.red_player.pawns)
        for pawn in state.blue_player.pawns:
            ret_value -= abs(pawn.coordinates[0] - 4) / 40
            ret_value -= abs(pawn.coordinates[1] - 2) / 25
        return ret_value

def defensive_evaluation(state):
    if (state.game_is_over() == "blue wins"):
        return 10
    if (state.game_is_over() == "red wins"):
        return -10
    material = len(state.blue_player.pawns) - len(state.red_player.pawns)
    position = 0
    for pawn in state.blue_player.pawns:
        if pawn.is_master and (pawn.coordinates[0] <= 1):
            position += .1
        if not pawn.is_master and (pawn.coordinates[0] >= 1):
            position += .025
    return material + (len(state.blue_player.pawns) * position)
    
def balanced_evaluation(state):
    if (state.game_is_over() == "blue wins"):
        return 10
    elif (state.game_is_over() == "red wins"):
        return -10
    else:
        ret_value = len(state.blue_player.pawns) - len(state.red_player.pawns)
        for pawn in state.blue_player.pawns:
            ret_value -= abs(pawn.coordinates[0] - 4) * .025
            ret_value -= abs(pawn.coordinates[1] - 2) * .25
    return ret_value
     
aggressive_table = [
    [0, 0, 0, 0, 0],
    [0, .05, .1, .05, 0],
    [.1, .15, .2, .15, .1],
    [.15, .2, .2, .2, .15],
    [0, .1, 0, .1, 0]
]

def aggressive_evaluation(state):
    if (state.game_is_over() == "blue wins"):
        return 10
    if (state.game_is_over() == "red wins"):
        return -10
    
    blue_numb = len(state.blue_player.pawns)
    material = blue_numb - len(state.red_player.pawns)

    ret_value = 2 * material + .33 * (5 - blue_numb)

    for pawn in state.blue_player.pawns:
        ret_value += aggressive_table[pawn.coordinates[0]][pawn.coordinates[1]]
    
    return ret_value


# This algorithm is pulled from the public repo of code for the book "Artificial Intelligence: A Modern Approach"
# https://github.com/aimacode
def alpha_beta_cutoff_search(state, game, d=4, cutoff_test=None, eval_fn=None):
    """Search game to determine best action; use alpha-beta pruning.
    This version cuts off search and uses an evaluation function."""

    player = game.to_move(state)

    # Functions used by alpha_beta
    def max_value(state, alpha, beta, depth):
        if cutoff_test(state, depth):
            return eval_fn(state)
        v = -np.inf
        for a in game.actions(state):
            v = max(v, min_value(game.result(state, a), alpha, beta, depth + 1))
            if v >= beta:
                return v
            alpha = max(alpha, v)
        return v

    def min_value(state, alpha, beta, depth):
        if cutoff_test(state, depth):
            return eval_fn(state)
        v = np.inf
        for a in game.actions(state):
            v = min(v, max_value(game.result(state, a), alpha, beta, depth + 1))
            if v <= alpha:
                return v
            beta = min(beta, v)
        return v

    # Body of alpha_beta_cutoff_search starts here:
    # The default test cuts off at depth d or at a terminal state
    cutoff_test = (cutoff_test or (lambda state, depth: depth > d or game.terminal_test(state)))
    eval_fn = eval_fn or (lambda state: game.utility(state, player))
    best_score = -np.inf
    beta = np.inf
    best_action = None
    for a in game.actions(state):
        v = min_value(game.result(state, a), best_score, beta, 1)
        if v > best_score:
            best_score = v
            best_action = a
    return best_action
