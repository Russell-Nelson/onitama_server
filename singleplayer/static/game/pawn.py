class Pawn:
    # Member variables
    # bool is_master: true for a master pawn ("king") only
    # string color: either "red" or "blue"
    # (int, int) coordinates: the (row, col) position of this pawn


    def __init__(self, is_master, color, coordinates):
        self.is_master = is_master

        self.color = color

        self.coordinates = coordinates
    
    def to_dict(self):
        return {
            "is_master": self.is_master,
            "color": self.color,
            "coordinates": self.coordinates
        }
    
    @staticmethod
    def create_from_dict(pawn_dict):
        coordinates = (pawn_dict["coordinates"][0], pawn_dict["coordinates"][1])
        return Pawn(pawn_dict["is_master"], pawn_dict["color"], coordinates)