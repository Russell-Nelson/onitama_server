from .space import Space
from .pawn import Pawn
from .player import Player
from .deck import Deck
from .card import Card
import json

pawn_dict = {
    ("blue", True): "B",
    ("blue", False): "b",
    ("red", True): "R",
    ("red", False): "r"
}

class Game_state:
    # Member variables
    # Space board[5][5]: an array of spaces that represent the actual board to play on
    # Player blue_player: the blue player
    # Player red_player: the red player
    # Card card_rotation[2]: Holds the card(s) that are being passed back and forth between players
    #                        card_rotation[0] is on the left side of the board and going to the blue player.
    #                        card_rotation[1] is on the right side of the board and going to the red player.
    # Player current_player: tracks whose turn it is

    def __init__(self, data, setup=False):
        if setup == True:
            self.board = [ [None]*5 for i in range(5)]

            # we fill the board array with spaces and pawns representing the inital board state
            for row in range(5):
                # row being zero means we are filling the top row with blue pieces
                if row == 0:
                    for column in range(5):
                        # fill with normal blue pawns
                        if (column != 2):
                            self.board[row][column] = Space((row, column), Pawn(False, "blue", (row, column)), "no temple")

                        # special case when column == 2 indicates master and temple
                        else:
                            self.board[row][column] = Space((row, column), Pawn(True, "blue", (row, column)), "blue temple")
                
                # rows 1 through 3 are just filled with empty spaces
                elif row in range(1, 4):
                    for column in range(5):
                        self.board[row][column] = Space((row, column), None, "no temple")
                
                # row being 4 means we are filling the bottom row with red pieces
                if (row == 4):
                    for column in range(5):
                        # fill with normal red pawns
                        if (column != 2):
                            self.board[row][column] = Space((row, column), Pawn(False, "red", (row, column)), "no temple")

                        # special case when column == 2 indicates master and temple
                        else:
                            self.board[row][column] = Space((row, column), Pawn(True, "red", (row, column)), "red temple")
                        
            # initialize the deck of cards
            all_cards = Deck()
            self.card_rotation = [None, None]
            
            # we create the two players for the game and give them their cards
            blue_card_0 = all_cards.retrieve_card(data['blue_card_0'])
            blue_card_1 = all_cards.retrieve_card(data['blue_card_1'])
            red_card_0 = all_cards.retrieve_card(data['red_card_0'])
            red_card_1 = all_cards.retrieve_card(data['red_card_1'])
            self.blue_player = Player(blue_card_0, blue_card_1, "blue", self)
            self.red_player = Player(red_card_0, red_card_1, "red", self)

            # draw the 5th card that will determine the first player
            fifth_card = all_cards.retrieve_card(data['middle_card'])
            if (fifth_card.starting_color == "red"):
                self.current_player = self.red_player
                self.card_rotation[1] = fifth_card
            else:
                self.current_player = self.blue_player
                self.card_rotation[0] = fifth_card

        else: # setup is false so we build a game from json data
            # data = json.loads(data)
            self.board = [ [None]*5 for i in range(5)]
            for row in range(5):
                for column in range(5):
                    if row == 0 and column == 2:
                        self.board[row][column] = Space((row, column), None, "blue temple")
                    elif row == 4 and column == 2:
                        self.board[row][column] = Space((row, column), None, "red temple")
                    else:
                        self.board[row][column] = Space((row, column), None, "no temple")
            
            # create the players
            self.blue_player = Player.create_from_dict(data["blue_player"])
            self.red_player = Player.create_from_dict(data["red_player"])

            # create the center cards
            self.card_rotation = [None, None]
            if data["card_rotation"][0] != None:
                self.card_rotation[0] = Card.create_from_dict(data["card_rotation"][0])
                self.current_player = self.blue_player
            else:
                self.card_rotation[1] = Card.create_from_dict(data["card_rotation"][1])
                self.current_player = self.red_player

            # populate the spaces
            for pawn in self.blue_player.pawns:
                pos = pawn.coordinates
                self.board[pos[0]][pos[1]].pawn = pawn
            
            for pawn in self.red_player.pawns:
                pos = pawn.coordinates
                self.board[pos[0]][pos[1]].pawn = pawn

    def to_dict(self):
        return {
            "blue_player": self.blue_player.to_dict(),
            "red_player": self.red_player.to_dict(),
            "card_rotation": [None if card == None else card.to_dict() for card in self.card_rotation],
        }

    # TODO: Delete this after done debugging
    def print_game_state(self):
        # a very messy, longhand version of printing out the game state
        string_rows = [None] * 21
        # each row has a width of 35

        # make the blue player's card area
        for row in range(5):
            string_rows[row] = " " * 10 + "-" * 5 + " " * 5 + "-" * 5 + " " * 10

        # make the top line of the board
        string_rows[5] = " " * 10 + "_" * 15 + " " * 10

        # fill in the empty contents of the board
        string_rows[6] = " " * 9 + "| " + "-  " * 4 + "- |" + " " * 9
        string_rows[7] = " " * 9 + "| " + "   " * 4 + "  |" + " " * 9
        string_rows[8] = " " + "-" * 5 + " " * 3 + "| " + "-  " * 4 + "- |   " + "-" * 5 + " " * 7
        string_rows[9] = " " + "-" * 5 + " " * 3 + "| " + "   " * 4 + "  |   " + "-" * 5 + " " * 7
        string_rows[10] = " " + "-" * 5 + " " * 3 + "| " + "-  " * 4 + "- |   " + "-" * 5 + " " * 7
        string_rows[11] = " " + "-" * 5 + " " * 3 + "| " + "   " * 4 + "  |   " + "-" * 5 + " " * 7
        string_rows[12] = " " + "-" * 5 + " " * 3 + "| " + "-  " * 4 + "- |   " + "-" * 5 + " " * 7
        string_rows[13] = " " * 9 + "| " + "   " * 4 + "  |" + " " * 9
        string_rows[14] = " " * 9 + "| " + "-  " * 4 + "- |" + " " * 9
        
        # make the bottom line of the board
        string_rows[15] = " " * 10 + "_"* 15 + " " * 10

        # make the red player's card area
        for row in range(16, 21):
            string_rows[row] = " " * 10 + "-" * 5 + " " * 5 + "-" * 5 + " " * 10

        # TODO: add the details of player's cards, the rotation car, and pawn positions
        o = "o"
        x = "x"

        # add the details to the blue player's cards
        # first blue card
        string_rows[2] = string_rows[2][:12] + o + string_rows[2][12 + 1:]
        for movement in self.blue_player.hand[0].movement:
            string_rows[2 - movement[0]] = string_rows[2 - movement[0]][:12 - movement[1]] + x + string_rows[2 - movement[0]][12 - movement[1] + 1:]
        
        # second blue card
        string_rows[2] = string_rows[2][:22] + o + string_rows[2][22 + 1:]
        for movement in self.blue_player.hand[1].movement:
            string_rows[2 - movement[0]] = string_rows[2 - movement[0]][:22 - movement[1]] + x + string_rows[2 - movement[0]][22 - movement[1] + 1:]

        # add the details to the red player's cards
        # first red card
        string_rows[18] = string_rows[18][:12] + o + string_rows[18][12 + 1:]
        for movement in self.red_player.hand[0].movement:
            string_rows[18 + movement[0]] = string_rows[18 + movement[0]][:12 + movement[1]] + x + string_rows[18 + movement[0]][12 + movement[1] + 1:]
        
        # second red card
        string_rows[18] = string_rows[18][:22] + o + string_rows[18][22 + 1:]
        for movement in self.red_player.hand[1].movement:
            string_rows[18 + movement[0]] = string_rows[18 + movement[0]][:22 + movement[1]] + x + string_rows[18 + movement[0]][22 + movement[1] + 1:]
        
        # add the rotation card
        if (self.card_rotation[0] != None):
            card = self.card_rotation[0]
            string_rows[10] = string_rows[10][:3] + o + string_rows[10][3 + 1:]
            for movement in card.movement:
                string_rows[10 - movement[0]] = string_rows[10 - movement[0]][:3 - movement[1]] + x + string_rows[10 - movement[0]][3 - movement[1] + 1:]
        
        if (self.card_rotation[1] != None):
            card = self.card_rotation[1]
            string_rows[10] = string_rows[10][:31] + o + string_rows[10][31 + 1:]
            for movement in card.movement:
                string_rows[10 + movement[0]] = string_rows[10 + movement[0]][:31 + movement[1]] + x + string_rows[10 + movement[0]][31 + movement[1] + 1:]

        # add in the pawns that exist on the board
        for row in range(5):
            for column in range(5):
                if (self.board[row][column].pawn != None):
                    #adjust the row and column to fit the printing format
                    adjusted_row = 6 + row * 2
                    adjusted_column = 11 + column * 3

                    # check which type and color to decide which char will represent this piece
                    symbol = pawn_dict[(self.board[row][column].pawn.color, self.board[row][column].pawn.is_master)]

                    string_rows[adjusted_row] = string_rows[adjusted_row][:adjusted_column] + symbol + string_rows[adjusted_row][adjusted_column + 1:] 


        for row in string_rows:
            print(row)


    def game_is_over(self):
        # check the blue master
        if not self.blue_player.has_master:
            return "red wins"
        # check the red master
        if not self.red_player.has_master:
            return "blue wins"

        # Check the blue temple
        if (self.board[0][2].pawn != None):
            if (self.board[0][2].pawn.color == "red" and self.board[0][2].pawn.is_master):
                return "red wins"
        # Check the red temple
        if (self.board[4][2].pawn != None):
            if (self.board[4][2].pawn.color == "blue" and self.board[4][2].pawn.is_master):
                return "blue wins"
        
        return False
