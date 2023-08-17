class Card:
    # Member variables
    # string name: the animal name of the card
    # string starting_color: either "red" or "blue" for initializing the game
    # (int, int) movement[]: an array of possible moves that the card allows in terms of relative position.


    def __init__(self, name, starting_color, movement):
        self.name = name

        self.starting_color = starting_color

        self.movement = movement
    
    def get_movement_index(self, source, destination):
        delta = (destination[0] - source[0], destination[1] - source[1])
        for i in range(len(self.movement)):
            if (delta == self.movement[i]):
                return i
    
    def to_dict(self):
        return {
            "name": self.name,
            "starting_color": self.starting_color,
            "movement": self.movement
        }

    @staticmethod
    def create_from_dict(card_dict):
        movement = [(x[0], x[1]) for x in card_dict["movement"]]
        return Card(card_dict["name"], card_dict["starting_color"], movement)
