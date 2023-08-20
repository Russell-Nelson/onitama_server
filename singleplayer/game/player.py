from .card import Card
from .pawn import Pawn

class Player:
    # Member variables
    # Card hand[2]: The two cards that are currently available to the player
    # string color: "red" or "blue"
    # bool has_master: tracks whether this player still has their master
    # Pawn[] pawns: a list of the pieces that the player has on the board

    def __init__(self, card0, card1, color, state):
        self.hand = [None] * 2
        self.hand[0] = card0
        self.hand[1] = card1
        self.color = color
        self.has_master = True
        self.pawns = []
        if state:
            if (color == "blue"):
                for column in range(5):
                    self.pawns.append(state.board[0][column].pawn)
            else:
                for column in range(5):
                    self.pawns.append(state.board[4][column].pawn)
    
    def to_dict(self):
        return {
            "hand": [self.hand[0].to_dict(), self.hand[1].to_dict()],
            "color": self.color,
            "has_master": self.has_master,
            "pawns": [pawn.to_dict() for pawn in self.pawns]
        }
    
    @staticmethod
    def create_from_dict(player_dict):
        card0 = Card.create_from_dict(player_dict["hand"][0])
        card1 = Card.create_from_dict(player_dict["hand"][1])

        player = Player(card0, card1, player_dict["color"], None)
        player.has_master = False

        # make the pawns
        for pawn_data in player_dict["pawns"]:
            pawn = Pawn.create_from_dict(pawn_data)
            player.has_master = player.has_master or pawn.is_master
            player.pawns.append(pawn)
        
        return player
        
