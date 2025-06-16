import random


def hsl_to_hex(h, s, l) -> str:
    l /= 100
    a = s * min(l, 1 - l) / 100
    def f(n):
        k = (n + h / 30) % 12
        color = l - a * max(min(k - 3, 9 - k, 1), -1)
        # convert to Hex and prefix "0" if needed
        return f"{round(255 * color):02x}"

    return f"#{f(0)}{f(8)}{f(4)}"


def get_random_dark_color() -> str:
    hue = random.randint(0, 255) # allowed range 0-255
    sat = random.randint(20, 100) # allowed range 0-100
    lum = random.randint(0, 60)  # allowed range 0-100
    color = hsl_to_hex(hue, sat, lum)
    return color
