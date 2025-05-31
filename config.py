pinButtons = [
    {
        "w": 13,
        "a": 12,
        "s": 14,
        "d": 27,
        "space": 26,
    },
    {
        "up": 13,
        "left": 12,
        "down": 14,
        "right": 27,
        "ctrl": 26,
    },
]

keyButtons = [
    {v: k for k, v in btnMap.items()}
    for btnMap in pinButtons
]

# print("keyButton:", keyButtons)
