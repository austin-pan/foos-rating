import math

def min_scaled_flat_score(actual_score_diff: float, rating_diff: float, win_score: int, flat_delta: float = 20) -> float:
    # Rating diff only
    rating_diff_coef = (1 / (1 + math.e ** (rating_diff / 40)))

    # Tiny bit extra for people who win harder
    # People who win by a lot should get a larger delta
    # actual_score_diff_coef = (2 / (1 + math.e ** (-actual_score_diff / 2))) - 1
    actual_score_diff_coef = 1

    return flat_delta * rating_diff_coef * actual_score_diff_coef

def sigmoid_differential(actual_score_diff: float, rating_diff: float, win_score: int) -> float:
    expected_score_diff = (2.0 / (1 + math.e ** (-rating_diff / 40)) - 1) * win_score
    # `actual_score_diff` is always > 0
    error = actual_score_diff - expected_score_diff

    # If error >> 0 (scored more than expected) large coef,
    # if error << 0 (scored less than expected)
    error_coef = (1.5 / (1 + math.e ** (-error))) + 0.25
    # If rating diff >> 0 then small coef, if rating diff << 0 then large coef
    rating_diff_coef = (1.5 / (1 + math.e ** (rating_diff / 40))) + 0.25
    delta = (actual_score_diff ** 1.3) * error_coef * rating_diff_coef
    # Scale delta to between 0 and 40
    return (40 / (1 + math.e ** (-delta / 30)) - 20) * 2

def square_differential(actual_score_diff: float) -> float:
    return actual_score_diff ** 2
