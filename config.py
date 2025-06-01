pinButtons = [
    {
        "w": 13,
        "a": 12,
        "s": 14,
        "d": 27,
        "space": 26,
    },
    {
        "up": 25,
        "left": 33,
        "down": 32,
        "right": 35,
        "ctrl": 34,
    },
]

keyButtons = [
    {v: k for k, v in btnMap.items()}
    for btnMap in pinButtons
]

# print("keyButton:", keyButtons)
