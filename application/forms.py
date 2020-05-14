from flask_wtf import FlaskForm
from wtforms import StringField, SubmitField, DecimalField, FileField, IntegerField, SelectField
from wtforms.validators import DataRequired, NumberRange, Optional


class NonValidatingSelectField(SelectField):
    """
    Attempt to make an open ended select multiple field that can accept dynamic
    choices added by the browser.
    """

    def pre_validate(self, form):
        pass


class CN2SDForm(FlaskForm):
    input_file = FileField('Input data (.csv file)', validators=[DataRequired()])
    output_column = NonValidatingSelectField('Output column name', choices=[], validators=[])
    positive_class = NonValidatingSelectField('Positive class value', choices=[], validators=[])
    max_expressions = IntegerField('Maximum expressions in search (integer >= 1, default 3)',
                                   validators=[Optional(),
                                               NumberRange(min=1, message="Must be an integer >= 1")])
    min_wracc = DecimalField('Minimum WRAcc (decimal in (0,1], default 0.05)',
                             validators=[Optional(),
                                         NumberRange(min=0.000001, max=1,
                                                     message="Must be a decimal > 0 and <= 1.")])
    methods = [(0, "No weight method (normal CN2)"), (1, "Multiplicative"), (2, "Additive")]
    weight_method = SelectField('Weight method', choices=methods, coerce=int, validators=[])
    gamma = DecimalField('Gamma parameter for multiplicative weight method (decimal in (0,1), default 0.5)',
                         validators=[Optional(), NumberRange(min=0.000001, max=0.999999,
                                                             message="Must be a decimal > 0 and < 1.")])
    submit = SubmitField('Start!')


class PRIMForm(FlaskForm):
    input_file = FileField('Input data (.csv file)', validators=[DataRequired()])
    output_column = NonValidatingSelectField('Output column name', choices=[], validators=[])
    positive_class = NonValidatingSelectField('Positive class value', choices=[], validators=[])
    alpha = DecimalField('Alpha (decimal in (0,1), default 0.1)',
                         validators=[Optional(),
                                     NumberRange(min=0.000001, max=0.999999,
                                                 message="Must be a decimal > 0 and < 1.")])
    threshold_box = DecimalField('Box support threshold (decimal in (0,1), default 0.1)',
                                 validators=[Optional(),
                                             NumberRange(min=0.000001, max=0.999999,
                                                         message="Must be a decimal > 0 and < 1.")])
    threshold_global = DecimalField('Global support threshold (decimal in (0,1), default 0.1)',
                                    validators=[Optional(),
                                                NumberRange(min=0.000001, max=0.999999,
                                                            message="Must be a decimal > 0 and < 1.")])
    min_mean = DecimalField('Minimum mean (decimal in (0,1), default is global mean)',
                            validators=[Optional(),
                                        NumberRange(min=0.000001, max=0.999999,
                                                    message="Must be a decimal > 0 and < 1.")])
    ordinal_columns = StringField('Ordinal columns (separated by comma)', validators=[Optional()])
    ordinal_columns_values = StringField('Ordered values of ordinal columns '
                                         '(separated by comma for each column and by semicolon to separate columns)',
                                         validators=[Optional()])
    submit = SubmitField('Start!')
