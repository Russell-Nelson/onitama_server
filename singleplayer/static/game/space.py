class Space:
    # Member variables
    # (int, int) coordinates: zero-indexed coordinates counted from the top left of the board (row, column)
    # Pawn pawn: the pawn that is currently in this space. None if empty.
    # string temple: "red temple" or "blue temple" if the space has a corresponding temple. Otherwise "no temple".

    def __init__(self, coordinates, pawn, temple):
        self.coordinates = coordinates

        self.pawn = pawn

        self.temple = temple