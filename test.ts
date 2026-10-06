// Manual smoke-test program for MakeCode.
// This file is compiled as a test file by PXT and is not part of the extension API.

gamepadV4.initialize()

gamepadV4.onButtonPressed(gamepadV4.Button.C, function () {
    basic.showString("C")
})

gamepadV4.onButtonPressed(gamepadV4.Button.Joystick, function () {
    gamepadV4.beep(880, 50)
})

gamepadV4.onJoystick(gamepadV4.Direction.Up, function () {
    basic.showArrow(ArrowNames.North)
})

gamepadV4.onJoystick(gamepadV4.Direction.Down, function () {
    basic.showArrow(ArrowNames.South)
})

gamepadV4.onJoystick(gamepadV4.Direction.Left, function () {
    basic.showArrow(ArrowNames.West)
})

gamepadV4.onJoystick(gamepadV4.Direction.Right, function () {
    basic.showArrow(ArrowNames.East)
})
