import copy

class Move:
    # Member variables
    # int piece_row: row indicating which piece to move
    # int piece_column: column indicating which piece to move
    # int card_index: either 0 (left card) or 1 (right card) representing card to be used
    # int movement_index: integer representing which movement will be used from that card


    def __init__(self, piece_row, piece_column, card_index, movement_index):
        self.piece_row = piece_row
        self.piece_column = piece_column
        self.card_index = card_index
        self.movement_index = movement_index

    def is_valid(self, game_state, player):
        # reject if there is no piece there or not the right color
        if (game_state.board[self.piece_row][self.piece_column].pawn == None or game_state.board[self.piece_row][self.piece_column].pawn.color != player.color):
            return False

        if (self.card_index not in [0, 1]):
            return False

        card = player.hand[self.card_index]
        
        if (self.movement_index >= len(card.movement)):
            return False
        
        movement = card.movement[self.movement_index]

        # mirror the movement if it is for the blue player
        if (player.color == "blue"):
            movement = (-movement[0], -movement[1])
        
        dest_row = self.piece_row + movement[0]
        dest_col = self.piece_column + movement[1]

        if (dest_row >= 5 or dest_col >= 5 or dest_row < 0 or dest_col < 0):
            return False

        destination = game_state.board[dest_row][dest_col]
        if (destination.pawn != None and destination.pawn.color == player.color):
            return False

        return True


    # only call perform_move after already validating the move
    def perform_move(self, game_state, player):
        card = player.hand[self.card_index]
        movement = card.movement[self.movement_index]
        # mirror the movement if it is for the blue player
        if (player.color == "blue"):
            movement = (-movement[0], -movement[1])

        # check if the move is going to capture a piece
        if (game_state.board[self.piece_row + movement[0]][self.piece_column + movement[1]].pawn != None):
            captured = game_state.board[self.piece_row + movement[0]][self.piece_column + movement[1]].pawn
            if (player.color == "blue"):
                game_state.red_player.pawns.remove(captured)
            else:
                game_state.blue_player.pawns.remove(captured)
            
            if (game_state.board[self.piece_row + movement[0]][self.piece_column + movement[1]].pawn.is_master):
                if (player.color == "blue"):
                    game_state.red_player.has_master = False
                else:
                    game_state.blue_player.has_master = False

        # move the pawn to the destination and empty out the place the pawn moved from, also update the pointers in the list player.pawns[]
        game_state.current_player.pawns.remove(game_state.board[self.piece_row][self.piece_column].pawn)
        game_state.board[self.piece_row][self.piece_column].pawn.coordinates = (self.piece_row + movement[0], self.piece_column + movement[1])
        game_state.board[self.piece_row + movement[0]][self.piece_column + movement[1]].pawn = game_state.board[self.piece_row][self.piece_column].pawn
        game_state.current_player.pawns.append(game_state.board[self.piece_row + movement[0]][self.piece_column + movement[1]].pawn)
        game_state.board[self.piece_row][self.piece_column].pawn = None

        # card logic based on the player's color
        if (player.color == "blue"):
            game_state.card_rotation[1] = card
            player.hand[self.card_index] = game_state.card_rotation[0]
            game_state.card_rotation[0] = None
        else:
            game_state.card_rotation[0] = card
            player.hand[self.card_index] = game_state.card_rotation[1]
            game_state.card_rotation[1] = None
        
        # finally, change the current player status
        if (player.color == "blue"):
            game_state.current_player = game_state.red_player
        else:
            game_state.current_player = game_state.blue_player



    # copies the game state and performs a move, then returns the altered copy
    def simulate_move(self, game_state):
        simulated_state = copy.deepcopy(game_state)
        player = simulated_state.current_player
        self.perform_move(simulated_state, player)
        return simulated_state


    def will_capture(self, state):
        card = state.current_player.hand[self.card_index]
        
        movement = card.movement[self.movement_index]

        # mirror the movement if it is for the blue player
        if (state.current_player.color == "blue"):
            movement = (-movement[0], -movement[1])
        
        dest_row = self.piece_row + movement[0]
        dest_col = self.piece_column + movement[1]

        destination = state.board[dest_row][dest_col]
        is_empty = (destination.pawn == None)
        return not is_empty