from sklearn import tree
import itertools as it
import pandas as pd


def VizRank(input_data, col_output, fixed_col=None):
    """
    Performs the VizRank process, determining the best two
    variables of the data better suited for data visualization,
    according to the classes of the output column. It uses decision trees for the ranking.
    Method found in:
    https://www.researchgate.net/publication/225719533_VizRank_Data_Visualization_Guided_by_Machine_Learning.
    :param input_data:
    :param col_output:
    :param fixed_col: Column that needs to be one of the chosen for visualization (optional).
    :return:
    """
    columns = list(input_data.columns)
    # The output column is not used for visualization
    columns.remove(col_output)
    # Create combinations of variables
    variable_pairs = []
    if fixed_col:
        # The fixed column is eliminated from the possibilities
        columns.remove(fixed_col)
        variable_pairs = [[fixed_col, x] for x in columns]
        fixed_col_type = input_data[fixed_col].dtype
        if fixed_col_type.name == "object" or fixed_col_type.name == "category":
            fixed_column = convert_to_dummies(input_data[fixed_col])
        else:
            fixed_column = input_data[fixed_col]
    else:
        # Generate all combinations of pairs of columns
        for a, b in it.combinations(columns, 2):
            variable_pairs.append([a, b])
    best_score = 0
    best_pair = []
    for pair in variable_pairs:
        if fixed_col:
            cols1 = fixed_column
        else:
            # Build and train the model:
            cols1 = input_data[pair[0]]
            col1_type = cols1.dtype
            if col1_type.name == "object" or col1_type.name == "category":
                cols1 = convert_to_dummies(cols1)
        cols2 = input_data[pair[1]]
        col2_type = cols2.dtype
        if col2_type.name == "object" or col2_type.name == "category":
            cols2 = convert_to_dummies(cols2)
        # Build tree model
        clf = tree.DecisionTreeClassifier()
        # Build input data for the model from columns selected
        data_tree = pd.concat([cols1, cols2], axis=1)
        # Fit and evaluate the model
        clf.fit(X=data_tree, y=input_data[col_output])
        score = clf.score(data_tree, input_data[col_output])
        if score >= best_score:
            best_score = score
            best_pair = pair
    return best_pair, best_score


def convert_to_dummies(column):
    col_dummy = pd.get_dummies(pd.DataFrame(column))
    return col_dummy


# if __name__ == "__main__":
#     data = pd.read_csv("entrada.csv")
#     VizRank(data, col_output="Survived", fixed_col="Pclass")
