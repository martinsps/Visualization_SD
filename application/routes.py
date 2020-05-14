import os

from flask import Blueprint, render_template, session, flash, redirect, url_for, request, abort, make_response, \
    send_file
from flask import current_app

from .forms import CN2SDForm, PRIMForm
from .algorithms.CN2_SD import initialize_CN2_SD
from .algorithms.PRIM import initialize_PRIM, Box
import pandas as pd
from .algorithms.errors import UserInputError
import json
from .VizRank.main import VizRank

main_bp = Blueprint('main_bp', __name__,
                    template_folder='templates',
                    static_folder='static')


@main_bp.route('/', methods=['GET'])
def main():
    return render_template('index.html')


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ['csv']


@main_bp.route('/data_columns', methods=['POST'])
def data_columns():
    if 'input_file' not in request.files:
        abort(make_response('No file part', 400))
    file = request.files['input_file']
    # If user does not select file, browser also
    # submit an empty part without filename
    if file.filename == '':
        abort(make_response('No selected file', 400))
    # Check for extension
    if not allowed_file(file.filename):
        abort(make_response('File must be a csv', 400))
    # Read csv file from request
    input_data = pd.read_csv(file).dropna()
    info_columns = {}
    columns = list(input_data.columns)
    for col_name in columns:
        column = input_data[col_name]
        column = column.astype("category")
        levels = column.unique()
        info_columns[col_name] = list(levels)
    # current_app.logger.debug(info_columns, 'error')
    return json.dumps(info_columns, indent=2, allow_nan=False)


##############
# CN2 routes #
##############

@main_bp.route('/cn2', methods=['GET', 'POST'])
def cn2():
    form = CN2SDForm()
    if form.validate_on_submit():
        # Read input data file
        # Check if the post request has the file part
        if 'input_file' not in request.files:
            flash('No file part', 'danger')
            return redirect(request.url)
        file = request.files['input_file']
        # If user does not select file, browser also
        # submit an empty part without filename
        if file.filename == '':
            flash('No selected file', 'danger')
            return redirect(request.url)
        # Check for extension
        if not allowed_file(file.filename):
            flash('File must be a csv', 'danger')
            return redirect(request.url)
        # Read csv file from request
        input_data = pd.read_csv(file)
        # Check validity of parameters
        args = {"input_data": input_data.dropna(),
                "col_output": form.output_column.data,
                "positive_class": form.positive_class.data,
                "weight_method": form.weight_method.data}
        if form.gamma.data:
            args["gamma"] = form.gamma.data
        if form.max_expressions.data:
            args["max_exp"] = form.max_expressions.data
        if form.min_wracc.data:
            args["min_wracc"] = form.min_wracc.data
        try:
            CN2 = initialize_CN2_SD(**args)
        except UserInputError as error:
            flash(error.message, 'danger')
            return redirect(request.url)
        except KeyError as error:
            flash(f' Key error: {str(error)}', 'danger')
            return redirect(request.url)
        # Set session CN2 object
        session['CN2'] = CN2
        return redirect(url_for('main_bp.cn2_exec'))
    return render_template('cn2_main.html', form=form)


@main_bp.route('/cn2/exec', methods=['GET', 'POST'])
def cn2_exec():
    CN2 = session['CN2']
    end = False
    best_rule = None
    if request.method == 'POST':
        end, best_rule = CN2.do_step()
    # Choose cols to show
    data, cols = prepare_data_CN2(CN2, best_rule)
    return render_template('cn2_exec.html', rule_list=CN2.rule_list, end=end, data=data, cols=cols,
                           col_output=CN2.col_output)


def prepare_data_CN2(CN2, last_rule):
    """
    Prepares data to be sent to template. First, it selects
    the columns that will be in the graph via VizRank of checking
    last rule found. Then, it also adds the output column and
    the weights column. Finally, it transforms the data in those
    columns to JSON format.
    :param CN2: a CN2 algorithm object
    :param last_rule: last rule found
    :return: formatted data, ready to be send to template and columns selected
    """
    cols = []
    if last_rule:
        if len(last_rule.antecedents) > 1:
            var1 = last_rule.antecedents[0].variable
            var2 = last_rule.antecedents[1].variable
            if var1 != var2:
                cols = [var1, var2]
            else:
                actual_len = 2
                end = False
                while not end and actual_len < len(last_rule.antecedents):
                    var2 = last_rule.antecedents[actual_len].variable
                    actual_len += 1
                    if var1 != var2:
                        cols = [var1, var2]
                        end = True
                if not end:
                    cols, _ = VizRank(input_data=CN2.current_data.drop(["weight_times", "weights"], axis=1),
                                      col_output=CN2.col_output,
                                      fixed_col=var1
                                      )
        elif len(last_rule.antecedents) == 1:
            cols, _ = VizRank(input_data=CN2.current_data.drop(["weight_times", "weights"], axis=1),
                              col_output=CN2.col_output,
                              fixed_col=last_rule.antecedents[0].variable
                              )
    else:
        cols, _ = VizRank(input_data=CN2.current_data.drop(["weight_times", "weights"], axis=1),
                          col_output=CN2.col_output
                          )
    data = CN2.current_data
    cols_data = cols + ["weights"] + [CN2.col_output]
    data = data[cols_data]
    # Prepare data por d3
    chart_data = data.to_dict(orient='records')
    chart_data = json.dumps(chart_data, indent=2)
    data = {'chart_data': chart_data}
    return data, cols


###############
# PRIM routes #
###############

@main_bp.route('/prim', methods=['GET', 'POST'])
def prim():
    form = PRIMForm()
    if form.validate_on_submit():
        # Read input data file
        # Check if the post request has the file part
        if 'input_file' not in request.files:
            flash('No file part', 'danger')
            return redirect(request.url)
        file = request.files['input_file']
        # If user does not select file, browser also
        # submit an empty part without filename
        if file.filename == '':
            flash('No selected file', 'danger')
            return redirect(request.url)
        # Check for extension
        if not allowed_file(file.filename):
            flash('File must be a csv', 'danger')
            return redirect(request.url)
        # Read csv file from request
        input_data = pd.read_csv(file)
        ordinal_columns = {}
        if len(form.ordinal_columns.data) > 0:
            # Names separated by comma
            ordinal_col_names = [x.strip() for x in form.ordinal_columns.data.split(',')]
            # Ordered column values lists separated by ;
            ordinal_col_values = form.ordinal_columns_values.data.split(';')
        try:
            if len(form.ordinal_columns.data) > 0:
                for i, ord_col in enumerate(ordinal_col_names):
                    # We convert string values to column type if necessary
                    ordinal_columns[ord_col] = [type(input_data[ord_col][0])(x.strip())
                                                for x in ordinal_col_values[i].split(',')]
            args = {"input_data": input_data.dropna(),
                    "col_output": form.output_column.data,
                    "positive_class": form.positive_class.data,
                    "ordinal_columns": ordinal_columns}
            if form.alpha.data:
                args["alpha"] = form.alpha.data
            if form.threshold_global.data:
                args["threshold_global"] = form.threshold_global.data
            if form.threshold_box.data:
                args["threshold_box"] = form.threshold_box.data
            if form.min_mean.data:
                args["min_mean"] = form.min_mean.data
            PRIM = initialize_PRIM(**args)
        except UserInputError as error:
            flash(error.message, 'danger')
            return redirect(request.url)
        except KeyError as error:
            flash(f' Key error: {str(error)}', 'danger')
            return redirect(request.url)
        # Set session PRIM object and variables
        session['PRIM'] = PRIM
        session['box_data'] = PRIM.current_data
        session['box'] = Box()
        session['end_PRIM'] = False
        return redirect(url_for('main_bp.prim_exec'))
    return render_template('prim_main.html', form=form)


def prepare_data_PRIM(PRIM, current_box, box_data):
    """
    Prepares data to be sent to template. First, it selects
    the columns that will be in the graph via VizRank of checking
    boundaries in current box. Then, it also adds the output column
    and the bitmap column for box data. Finally, it transforms the data
    in those columns to JSON format.
    :param PRIM: an object of PRIM's algorithm
    :param current_box:
    :param box_data:
    :return: formatted data, ready to be send to template and columns selected
    """
    # Choose cols
    cols = []
    if len(current_box.boundary_list) > 0:
        if len(current_box.boundary_list) > 1:
            var1 = current_box.boundary_list[-2].variable_name
            var2 = current_box.boundary_list[-1].variable_name
            if var1 != var2:
                cols = [var1, var2]
            else:
                actual_len = 2
                end = False
                while not end and actual_len < len(current_box.boundary_list):
                    actual_len += 1
                    var1 = current_box.boundary_list[-actual_len].variable_name
                    if var1 != var2:
                        cols = [var1, var2]
                        end = True
                if not end:
                    cols, _ = VizRank(input_data=PRIM.current_data,
                                      col_output=PRIM.col_output,
                                      fixed_col=var1
                                      )
        elif len(current_box.boundary_list) == 1:
            cols, _ = VizRank(input_data=PRIM.current_data,
                              col_output=PRIM.col_output,
                              fixed_col=current_box.boundary_list[0].variable_name
                              )
    else:
        cols, _ = VizRank(input_data=PRIM.current_data,
                          col_output=PRIM.col_output
                          )
    cols_data = cols + [PRIM.col_output]
    data = PRIM.current_data[cols_data]
    data["In_current_box"] = PRIM.get_current_box_bitmap(box_data)["In_current_box"]
    # Prepare data por d3
    chart_data = data.to_dict(orient='records')
    chart_data = json.dumps(chart_data, indent=2)
    data = {'chart_data': chart_data}
    return data, cols


@main_bp.route('/prim/exec', methods=['GET', 'POST'])
def prim_exec():
    PRIM = session['PRIM']
    box_data = session['box_data']
    box = session['box']
    end_box, end_prim = False, False
    pasting, redundant = False, False
    if request.method == 'POST':
        box, box_data, end_box = PRIM.do_step_box(box, box_data)
        session['PRIM'] = PRIM
        session['box_data'] = box_data
        session['box'] = box
        if end_box:
            pasting = True
            flash("Box is finished. Click the button to execute the pasting.", "info")
    else:
        end_prim = session['end_PRIM']
    data, cols = prepare_data_PRIM(PRIM, box, box_data)
    return render_template('prim_exec.html', box_list=PRIM.boxes, current_box=box, end_box=end_box, data=data,
                           cols=cols, col_output=PRIM.col_output, pasting=pasting, redundant=redundant,
                           end_prim=end_prim)


@main_bp.route('/prim/pasting', methods=['POST'])
def prim_pasting():
    PRIM = session['PRIM']
    box_data = session['box_data']
    box = session['box']
    box, box_data = PRIM.bottom_up_pasting(box, box_data)
    session['PRIM'] = PRIM
    session['box_data'] = box_data
    session['box'] = box
    data, cols = prepare_data_PRIM(PRIM, box, box_data)
    flash("Pasting is finished. Click the button to execute the elimination of redundant input variables.", "info")
    return render_template('prim_exec.html', box_list=PRIM.boxes, current_box=box, end_box=True, data=data,
                           cols=cols, col_output=PRIM.col_output, pasting=False, redundant=True)


@main_bp.route('/prim/redundant', methods=['POST'])
def prim_redundant():
    PRIM = session['PRIM']
    box_data = session['box_data']
    box = session['box']
    box, box_data, variables_eliminated = PRIM.redundant_input_variables(box, box_data)
    if len(variables_eliminated) > 0:
        flash(f"The following variables were eliminated from the box: {variables_eliminated}", "success")
    else:
        flash("No variables were eliminated!", "info")
    PRIM.update_variables(box, box_data)
    session['PRIM'] = PRIM
    session['end_PRIM'] = PRIM.stop_condition_PRIM(box_data)
    session['box_data'] = PRIM.current_data
    session['box'] = Box()
    return redirect(url_for('main_bp.prim_exec'))


###################
# Datasets routes #
###################


titles_descriptions = {
    "diamonds.csv": ("Diamonds", "This dataset contains data about a set of diamonds, regarding some of their "
                                 "properties like width, depth, cut or color. We can use the algorithms to "
                                 "characterise the diamonds with a value of the variable \"cut\" such as \"Ideal\". "
                                 "There are categorical, numeric and ordinal variables in this dataset. "
                                 "The ordinal one is \"color\" whose order is defined as "
                                 "J < I < H < G < F < E < D."),
    "iris.csv": ("Iris", "Iris dataset, perhaps the best known database to be found in the pattern recognition "
                         "literature. Predicted attribute: class of iris plant. All the other attributes "
                         "are numeric and describe physical characteristics of each plant. It is not suitable "
                         "for CN2-SD, as this implementation does not take numeric attributes into account."),
    "mushrooms.csv": ("Mushrooms", "A dataset with information about mushrooms with a target class (\"class\") that "
                                   "determines if the mushroom is edible (\"e\") or poisonous (\"p\"). The rest "
                                   "of attributes are categorical and describe their characteristics. Information "
                                   "about the attributes (and also the file) can be found in this URL: "
                                   "https://www.kaggle.com/uciml/mushroom-classification "),
    "titanic.csv": ("Titanic", "This dataset contains information about the passengers aboard the Titanic, including "
                               "a target class (\"Survived\") that determines if the person survived the tragic "
                               "accident. It contains both numeric and categorical attributes."),
    "Pokemon.csv": ("Pokemon", "This dataset contains all the pokemons ever created, with characteristics regarding "
                               "each pokemon's classes or attributes (like HP, attack...). With this dataset we can "
                               "try to characterise the legendary ones, marked in the target variable \"Legendary\". ")
}


@main_bp.route('/examples', methods=['GET'])
def examples_main():
    return render_template('examples.html', titles_descriptions=titles_descriptions)


dataset_folder = os.path.join(current_app.root_path, "static/data")


@main_bp.route('/examples/<filename>', methods=['GET'])
def examples_download(filename):
    path = os.path.join(dataset_folder, filename)
    return send_file(path, as_attachment=True)
