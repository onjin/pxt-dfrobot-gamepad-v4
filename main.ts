/**
 * DFRobot micro:GamePad V4 driver for BBC micro:bit.
 *
 * Pin map:
 * - C: P13
 * - D: P14
 * - E: P15
 * - F: P16
 * - Joystick button: P8
 * - Joystick X: P1
 * - Joystick Y: P2
 * - Vibration + LED: P12
 * - Buzzer: P0
 */

//% color="#00796B" icon="\uf11b" block="GamePad V4"
namespace gamepadV4 {
    export enum Button {
        //% block="C"
        C = 0,
        //% block="D"
        D = 1,
        //% block="E"
        E = 2,
        //% block="F"
        F = 3,
        //% block="joystick"
        Joystick = 4
    }

    export enum Direction {
        //% block="center"
        Center = 0,
        //% block="up"
        Up = 1,
        //% block="down"
        Down = 2,
        //% block="left"
        Left = 3,
        //% block="right"
        Right = 4
    }

    const EVENT_SOURCE_BUTTON = 7300
    const EVENT_SOURCE_JOYSTICK = 7301

    const BUTTON_PINS: DigitalPin[] = [
        DigitalPin.P13,
        DigitalPin.P14,
        DigitalPin.P15,
        DigitalPin.P16,
        DigitalPin.P8
    ]

    const DEFAULT_LOW_THRESHOLD = 300
    const DEFAULT_HIGH_THRESHOLD = 700
    const DEFAULT_CENTER_LOW = 400
    const DEFAULT_CENTER_HIGH = 600
    const POLL_MS = 10
    const DEBOUNCE_MS = 25

    let initialized = false
    let monitorStarted = false
    let lowThreshold = DEFAULT_LOW_THRESHOLD
    let highThreshold = DEFAULT_HIGH_THRESHOLD
    let centerLow = DEFAULT_CENTER_LOW
    let centerHigh = DEFAULT_CENTER_HIGH

    let stableButtonState: boolean[] = [false, false, false, false, false]
    let sampledButtonState: boolean[] = [false, false, false, false, false]
    let sampledSince: number[] = [0, 0, 0, 0, 0]

    let joystickState = Direction.Center

    function pinForButton(button: Button): DigitalPin {
        return BUTTON_PINS[button]
    }

    function readButtonRaw(button: Button): boolean {
        return pins.digitalReadPin(pinForButton(button)) === 0
    }

    function setupPins(): void {
        for (let i = 0; i < BUTTON_PINS.length; i++) {
            pins.setPull(BUTTON_PINS[i], PinPullMode.PullUp)
        }

        pins.digitalWritePin(DigitalPin.P12, 0)
        pins.analogSetPitchPin(AnalogPin.P0)
    }

    function initialButtonState(): void {
        const now = input.runningTime()
        for (let i = 0; i < BUTTON_PINS.length; i++) {
            const pressed = pins.digitalReadPin(BUTTON_PINS[i]) === 0
            stableButtonState[i] = pressed
            sampledButtonState[i] = pressed
            sampledSince[i] = now
        }
    }

    function ensureInitialized(): void {
        if (initialized) {
            return
        }

        setupPins()
        initialButtonState()
        initialized = true
    }

    function updateButton(button: Button, now: number): void {
        const index = button as number
        const pressed = readButtonRaw(button)

        if (pressed !== sampledButtonState[index]) {
            sampledButtonState[index] = pressed
            sampledSince[index] = now
            return
        }

        if (pressed === stableButtonState[index]) {
            return
        }

        if (now - sampledSince[index] < DEBOUNCE_MS) {
            return
        }

        stableButtonState[index] = pressed
        if (pressed) {
            control.raiseEvent(EVENT_SOURCE_BUTTON, index + 1)
        }
    }

    function calculateDirection(x: number, y: number): Direction {
        if (joystickState === Direction.Up && y < centerLow) {
            return Direction.Up
        }
        if (joystickState === Direction.Down && y > centerHigh) {
            return Direction.Down
        }
        if (joystickState === Direction.Left && x < centerLow) {
            return Direction.Left
        }
        if (joystickState === Direction.Right && x > centerHigh) {
            return Direction.Right
        }

        if (y < lowThreshold) {
            return Direction.Up
        }
        if (y > highThreshold) {
            return Direction.Down
        }
        if (x < lowThreshold) {
            return Direction.Left
        }
        if (x > highThreshold) {
            return Direction.Right
        }
        return Direction.Center
    }

    function updateJoystick(): void {
        const x = pins.analogReadPin(AnalogPin.P1)
        const y = pins.analogReadPin(AnalogPin.P2)
        const next = calculateDirection(x, y)

        if (next === joystickState) {
            return
        }

        joystickState = next
        if (next !== Direction.Center) {
            control.raiseEvent(EVENT_SOURCE_JOYSTICK, next)
        }
    }

    function startMonitor(): void {
        ensureInitialized()
        if (monitorStarted) {
            return
        }

        monitorStarted = true
        control.inBackground(function () {
            while (true) {
                const now = input.runningTime()
                updateButton(Button.C, now)
                updateButton(Button.D, now)
                updateButton(Button.E, now)
                updateButton(Button.F, now)
                updateButton(Button.Joystick, now)
                updateJoystick()
                basic.pause(POLL_MS)
            }
        })
    }

    /** Initialize the gamepad pins and event monitor. */
    //% blockId=dfrobot_gamepad_v4_init block="initialize GamePad V4"
    //% weight=100
    export function initialize(): void {
        startMonitor()
    }

    /** Run code once for each debounced button press. */
    //% blockId=dfrobot_gamepad_v4_on_button_pressed block="on GamePad button %button pressed"
    //% weight=95
    export function onButtonPressed(button: Button, handler: () => void): void {
        startMonitor()
        control.onEvent(EVENT_SOURCE_BUTTON, (button as number) + 1, handler)
    }

    /** Return true while a button is physically held down. */
    //% blockId=dfrobot_gamepad_v4_is_pressed block="GamePad button %button is pressed"
    //% weight=90
    export function isPressed(button: Button): boolean {
        ensureInitialized()
        return readButtonRaw(button)
    }

    /** Run code once when the joystick enters a direction. */
    //% blockId=dfrobot_gamepad_v4_on_joystick block="on joystick moved %direction"
    //% weight=85
    export function onJoystick(direction: Direction, handler: () => void): void {
        startMonitor()
        if (direction === Direction.Center) {
            return
        }
        control.onEvent(EVENT_SOURCE_JOYSTICK, direction, handler)
    }

    /** Return the raw joystick X position, 0..1023. */
    //% blockId=dfrobot_gamepad_v4_joystick_x block="joystick X"
    //% weight=80
    export function joystickX(): number {
        ensureInitialized()
        return pins.analogReadPin(AnalogPin.P1)
    }

    /** Return the raw joystick Y position, 0..1023. */
    //% blockId=dfrobot_gamepad_v4_joystick_y block="joystick Y"
    //% weight=79
    export function joystickY(): number {
        ensureInitialized()
        return pins.analogReadPin(AnalogPin.P2)
    }

    /** Return the current joystick direction using hysteresis. */
    //% blockId=dfrobot_gamepad_v4_direction block="joystick direction"
    //% weight=78
    export function direction(): Direction {
        ensureInitialized()
        const x = pins.analogReadPin(AnalogPin.P1)
        const y = pins.analogReadPin(AnalogPin.P2)
        return calculateDirection(x, y)
    }

    /** Configure joystick thresholds and center hysteresis. */
    //% blockId=dfrobot_gamepad_v4_thresholds block="set joystick thresholds low %low high %high center low %newCenterLow center high %newCenterHigh"
    //% low.min=0 low.max=1023 low.defl=300
    //% high.min=0 high.max=1023 high.defl=700
    //% newCenterLow.min=0 newCenterLow.max=1023 newCenterLow.defl=400
    //% newCenterHigh.min=0 newCenterHigh.max=1023 newCenterHigh.defl=600
    //% advanced=true
    //% weight=40
    export function setJoystickThresholds(low: number, high: number, newCenterLow: number, newCenterHigh: number): void {
        if (low < 0) low = 0
        if (high > 1023) high = 1023
        if (newCenterLow < low) newCenterLow = low
        if (newCenterHigh > high) newCenterHigh = high

        lowThreshold = low
        highThreshold = high
        centerLow = newCenterLow
        centerHigh = newCenterHigh
    }

    /** Set vibration/LED strength on P12, from 0 to 1023. */
    //% blockId=dfrobot_gamepad_v4_vibration_strength block="set vibration strength %strength"
    //% strength.min=0 strength.max=1023 strength.defl=300
    //% weight=70
    export function setVibrationStrength(strength: number): void {
        ensureInitialized()
        if (strength < 0) strength = 0
        if (strength > 1023) strength = 1023
        pins.analogWritePin(AnalogPin.P12, strength)
    }

    /** Vibrate with selected strength for the given time. */
    //% blockId=dfrobot_gamepad_v4_vibrate block="vibrate strength %strength for %duration ms"
    //% strength.min=0 strength.max=1023 strength.defl=300
    //% duration.min=1 duration.max=5000 duration.defl=200
    //% weight=69
    export function vibrate(strength: number, duration: number): void {
        setVibrationStrength(strength)
        basic.pause(duration)
        stopVibration()
    }

    /** Stop vibration and turn off the P12 LED. */
    //% blockId=dfrobot_gamepad_v4_stop_vibration block="stop vibration"
    //% weight=68
    export function stopVibration(): void {
        ensureInitialized()
        pins.analogWritePin(AnalogPin.P12, 0)
    }

    /** Play a tone on the gamepad buzzer connected to P0. */
    //% blockId=dfrobot_gamepad_v4_beep block="beep %frequency Hz for %duration ms"
    //% frequency.min=20 frequency.max=12000 frequency.defl=440
    //% duration.min=1 duration.max=5000 duration.defl=100
    //% weight=60
    export function beep(frequency: number, duration: number): void {
        ensureInitialized()
        pins.analogSetPitchPin(AnalogPin.P0)
        music.playTone(frequency, duration)
    }
}
