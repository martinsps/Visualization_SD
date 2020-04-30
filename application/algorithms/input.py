from .errors import UserInputError
from numbers import Number


def check_input_data(input_data, col_output, positive_class):
    # If column does not exist, "KeyError" is thrown
    column = input_data[col_output]
    column = column.astype("category")
    levels = column.unique()
    if positive_class not in levels:
        raise UserInputError("Positive class is not on the output column levels.")


def check_parameters_PRIM(input_data, alpha, threshold_box, threshold_global, min_mean, ordinal_columns):
    if not isinstance(alpha, Number) or alpha <= 0 or alpha >= 1:
        raise UserInputError("Alpha must be a decimal > 0 and < 1.")
    if not isinstance(threshold_box, Number) or threshold_box <= 0 or threshold_box >= 1:
        raise UserInputError("Box threshold must be a decimal > 0 and < 1.")
    if not isinstance(threshold_global, Number) or threshold_global <= 0 or threshold_global >= 1:
        raise UserInputError("Global threshold must be a decimal > 0 and < 1.")
    if not isinstance(min_mean, Number) or min_mean <= 0 or min_mean >= 1:
        raise UserInputError("Mean minimum must be a decimal > 0 and < 1.")
    # Check ordinal columns
    for col_name in ordinal_columns.keys():
        column = input_data[col_name]
        column = column.astype("category")
        levels = column.unique()
        for level in ordinal_columns[col_name]:
            if level not in levels:
                raise UserInputError(f"The level {level} of column {col_name} is incorrect.")


def check_parameters_CN2(max_exp, min_wracc, weight_method, gamma):
    if not isinstance(max_exp, int) or max_exp < 1:
        raise UserInputError("Max expressions must be an integer >= 1.")
    if not isinstance(min_wracc, Number) or min_wracc <= 0 or min_wracc > 1:
        raise UserInputError("Min WRAcc must be a decimal > 0 and <= 1.")
    if weight_method not in [0, 1, 2]:
        raise UserInputError("Weight method must be 0 (no method), 1 (multiplicative) or 2 (additive).")
    if not isinstance(gamma, Number) or gamma <= 0 or min_wracc >= 1:
        raise UserInputError("Gamma must be a decimal > 0 and < 1.")
