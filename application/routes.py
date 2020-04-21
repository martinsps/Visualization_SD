from flask import Blueprint, render_template, session, flash, redirect, url_for, request
from flask import current_app

from .forms import CN2SDForm
from .algorithms.CN2_SD import CN2_SD, initialize_CN2_SD
import pandas as pd
import pandas as pd
from .algorithms.errors import UserInputError

main_bp = Blueprint('main_bp', __name__,
                    template_folder='templates',
                    static_folder='static')


@main_bp.route('/', methods=['GET'])
def main():
    return render_template('index.html')


@main_bp.route('/prim', methods=['GET', 'POST'])
def prim():
    # CN2 = session['CN2']
    # end, best_rule = CN2.do_step([])
    # session['CN2'] = CN2
    return render_template('prim_main.html')


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
    return render_template('cn2_exec.html', rule_list=CN2.rule_list, end=end)
