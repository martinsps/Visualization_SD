from .errors import UserInputError
from numbers import Number


def check_input_data_CN2(input_data, col_output, positive_class):
    # If column does not exist, "KeyError" is thrown
    column = input_data[col_output]
    column = column.astype("category")
    levels = column.unique()
    if positive_class not in levels:
        raise UserInputError("Positive class is not on the output column levels.")


def check_parameters_CN2(max_exp, min_wracc, weight_method, gamma):
    if not isinstance(max_exp, int) or max_exp < 1:
        raise UserInputError("Max expressions must be an integer >= 1.")
    if not isinstance(min_wracc, Number) or min_wracc <= 0 or min_wracc > 1:
        raise UserInputError("Min WRAcc must be a decimal > 0 and <= 1.")
    if weight_method not in [0, 1, 2]:
        raise UserInputError("Weight method must be 0 (no method), 1 (multiplicative) or 2 (additive).")
    if not isinstance(gamma, Number) or gamma <= 0 or min_wracc >= 1:
        raise UserInputError("Gamma must be a decimal > 0 and < 1.")
