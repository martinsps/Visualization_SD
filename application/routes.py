from flask import Blueprint, render_template, session, flash, redirect, url_for, request
from flask import current_app

from .forms import CN2SDForm
from .algorithms.CN2_SD import CN2_SD, initialize_CN2_SD
import pandas as pd
import pandas as pd

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

    # CN2 = CN2_SD(entrada, "Survived", "Yes", max_exp=2, min_wracc=0.05, weight_method=1, gamma=0.5)
    # session['CN2'] = CN2
    # CN2.min_wracc = 1
    # session['CN2'] = CN2
    form = CN2SDForm()
    if form.validate_on_submit():
        # Read input data file
        current_app.logger.info(request.files)
        # check if the post request has the file part
        if 'input_file' not in request.files:
            flash('No file part', 'danger')
            return redirect(request.url)
        file = request.files['input_file']
        # if user does not select file, browser also
        # submit an empty part without filename
        if file.filename == '':
            flash('No selected file', 'danger')
            return redirect(request.url)
        if not allowed_file(file.filename):
            flash('File must be a csv', 'danger')
            return redirect(request.url)
        if file:
            input_data = pd.read_csv(file)

        # set session CN2 object
        return redirect(url_for('main_bp.cn2_exec'))
    return render_template('cn2_main.html', form=form)


@main_bp.route('/cn2/exec', methods=['GET', 'POST'])
def cn2_exec():
    return render_template('cn2_exec.html')
