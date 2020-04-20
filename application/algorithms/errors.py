class Error(Exception):
    """Base class for exceptions in this module."""
    pass


class UserInputError(Error):
    def __init__(self, message):
        self.message = message
