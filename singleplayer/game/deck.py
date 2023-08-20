from .card import Card

class Deck:
    # Member variables
    # Card deck[]: all of the cards in a game

    def __init__(self):
        # this initializer makes all 16 unique cards in the game.
        self.deck= [None] * 16
        self.deck[0] = Card("shark", "blue", [(-2, 0), (1, 0)])
        self.deck[1] = Card("crab", "blue", [(-1, 0), (0, -2), (0, 2)])
        self.deck[2] = Card("fox", "blue", [(-1, -1), (-1, 1), (1, -1), (1, 1)])
        self.deck[3] = Card("crane", "blue", [(-1, 0), (1, -1), (1, 1)])
        self.deck[4] = Card("dragon", "red", [(-1, -2), (-1, 2), (1, -1), (1, 1)])
        self.deck[5] = Card("elephant", "red", [(-1, -1), (-1, 1), (0, -1), (0, 1)])
        self.deck[6] = Card("dragonfly", "red", [(-1, -1), (-1, 1), (1, 0)])
        self.deck[7] = Card("turtle", "red", [(-1, 0), (0, -1), (0, 1)])
        self.deck[8] = Card("frog", "red", [(-1, -1), (0, -2), (1, 1)])
        self.deck[9] = Card("bear", "blue", [(-1, -1), (0, -1), (0, 1), (1, 1)])
        self.deck[10] = Card("fish", "red", [(-1, 0), (0, -1), (1, 0)])
        self.deck[11] = Card("dog", "blue", [(-1, -1), (0, 1), (1, -1)])
        self.deck[12] = Card("rabbit", "blue", [(-1, 1), (0, 2), (1, -1)])
        self.deck[13] = Card("rooster", "red", [(-1, 1), (0, 1), (0, -1), (1, -1)])
        self.deck[14] = Card("mouse", "blue", [(-1, 0), (0, 1), (1, 0)])
        self.deck[15] = Card("ram", "red", [(-1, 1), (0, -1), (1, 1)])
    
    def retrieve_card(self, name):
        for card in self.deck:
            if (name == card.name):
                return card