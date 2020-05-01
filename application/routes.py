from flask import Blueprint, render_template, session, flash, redirect, url_for, request
from flask import current_app

from .forms import CN2SDForm, PRIMForm
from .algorithms.CN2_SD import CN2_SD, initialize_CN2_SD
from .algorithms.PRIM import PRIM, initialize_PRIM, Box
import pandas as pd
from .algorithms.errors import UserInputError
import json

main_bp = Blueprint('main_bp', __name__,
                    template_folder='templates',
                    static_folder='static')


@main_bp.route('/', methods=['GET'])
def main():
    return render_template('index.html')


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ['csv']


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
        if file:
            # Read csv file from request
            input_data = pd.read_csv(file)
        # Check validity of parameters
        try:
            if form.gamma.data:
                CN2 = initialize_CN2_SD(input_data=input_data,
                                        col_output=form.output_column.data,
                                        positive_class=form.positive_class.data,
                                        max_exp=form.max_expressions.data,
                                        min_wracc=form.min_wracc.data,
                                        weight_method=form.weight_method.data,
                                        gamma=float(form.gamma.data))
            else:
                CN2 = initialize_CN2_SD(input_data=input_data,
                                        col_output=form.output_column.data,
                                        positive_class=form.positive_class.data,
                                        max_exp=form.max_expressions.data,
                                        min_wracc=form.min_wracc.data,
                                        weight_method=form.weight_method.data)
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
    if request.method == 'POST':
        end, _ = CN2.do_step()
    data = CN2.current_data
    col_output = CN2.col_output
    # Choose cols
    cols = ["Age", "Fare"]
    cols_data = cols + ["weights"] + [col_output]
    data = data[cols_data]
    # Prepare data por d3
    chart_data = data.to_dict(orient='records')
    chart_data = json.dumps(chart_data, indent=2)
    data = {'chart_data': chart_data}
    return render_template('cn2_exec.html', rule_list=CN2.rule_list, end=end, data=data, cols=cols,
                           col_output=col_output)


@main_bp.route('/cn2/data', methods=['GET'])
def cn2_data():
    CN2 = session['CN2']
    data = CN2.current_data

    return data.to_json()


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
        if file:
            # Read csv file from request
            input_data = pd.read_csv(file)
        current_app.logger.debug(form.ordinal_columns.data, "error")
        # Check validity of parameters
        ordinal_columns = {}
        try:
            PRIM = initialize_PRIM(input_data=input_data,
                                   col_output=form.output_column.data,
                                   positive_class=form.positive_class.data,
                                   alpha=form.alpha.data,
                                   threshold_global=form.threshold_global.data,
                                   threshold_box=form.threshold_box.data,
                                   min_mean=form.min_mean.data,
                                   ordinal_columns=ordinal_columns
                                   )

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
        return redirect(url_for('main_bp.prim_exec'))
    return render_template('prim_main.html', form=form)


def prepare_data_PRIM(PRIM):
    data = PRIM.current_data
    col_output = PRIM.col_output
    # Choose cols
    cols = ["Age", "Fare"]
    cols_data = cols + [col_output]
    data = data[cols_data]
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
        end_prim = PRIM.stop_condition_PRIM(box_data)
    data, cols = prepare_data_PRIM(PRIM)
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
    data, cols = prepare_data_PRIM(PRIM)
    flash("Pasting is finished. Click the button to execute the elimination of redundant input variables.", "info")
    return render_template('prim_exec.html', box_list=PRIM.boxes, current_box=box, end_box=True, data=data,
                           cols=cols, col_output=PRIM.col_output, pasting=False, redundant=True)


#
#
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
    session['box_data'] = PRIM.current_data
    session['box'] = Box()
    return redirect(url_for('main_bp.prim_exec'))
