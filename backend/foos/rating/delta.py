import math

def scaled_square_differential(actual_score_diff: float, rating_diff: float, win_score: int) -> float:
    expected_score_diff = (2.0 / (1 + math.e ** (-rating_diff / 40)) - 1) * win_score
    # `actual_score_diff` is always > 0
    error = actual_score_diff - expected_score_diff

    # If error >> 0 (scored more than expected) large coef,
    # if error << 0 (scored less than expected)
    error_coef = (1.5 / (1 + math.e ** (-error))) + 0.25
    # If rating diff >> 0 then small coef, if rating diff << 0 then large coef
    rating_diff_coef = (1.5 / (1 + math.e ** (rating_diff / 40))) + 0.25
    delta = (actual_score_diff ** 1.3) * error_coef * rating_diff_coef
    # Scale delta to between 0 and 20
    return (40 / (1 + math.e ** (-delta / 30)) - 20) * 2

def square_differential(actual_score_diff: float) -> float:
    return actual_score_diff ** 2
