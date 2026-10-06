# DFRobot micro:GamePad V4 — MakeCode extension

Rozszerzenie dla BBC micro:bit i kontrolera **DFRobot micro:GamePad V4**.

Celem biblioteki jest ukrycie szczegółów sprzętowych takich jak pull-up, aktywne stanem niskim przyciski, debounce, wykrywanie pojedynczego naciśnięcia oraz histereza joysticka.

## Mapowanie pinów

| Funkcja | Pin micro:bit |
|---|---|
| Przycisk C | P13 |
| Przycisk D | P14 |
| Przycisk E | P15 |
| Przycisk F | P16 |
| Przycisk joysticka | P8 |
| Joystick X | P1 |
| Joystick Y | P2 |
| Wibracja + LED | P12 |
| Buzzer | P0 |

Przyciski są obsługiwane jako **active LOW** i biblioteka automatycznie ustawia `PullUp`.

## Najważniejsze bloki

- `on GamePad button ... pressed` — zdarzenie wykonywane dokładnie raz na jedno fizyczne naciśnięcie.
- `GamePad button ... is pressed` — stan przycisku podczas trzymania.
- `on joystick moved ...` — zdarzenie po wejściu joysticka w kierunek.
- `joystick X`, `joystick Y` — surowe wartości 0..1023.
- `joystick direction` — aktualny kierunek.
- `set vibration strength ...` — PWM na P12, zakres 0..1023.
- `vibrate strength ... for ... ms` — wibracja przez podany czas.
- `stop vibration` — wyłączenie P12.
- `beep ... Hz for ... ms` — dźwięk na buzzerze P0.

## Przykład: pojedynczy ruch sprite'a

```typescript
gamepadV4.onButtonPressed(gamepadV4.Button.C, function () {
    bird.change(LedSpriteProperty.Y, -1)
})

gamepadV4.onButtonPressed(gamepadV4.Button.E, function () {
    bird.change(LedSpriteProperty.Y, 1)
})
```

Nie jest potrzebne ręczne `old_up`, `old_down` ani `pause(100)`.

## Przykład: joystick

```typescript
gamepadV4.onJoystick(gamepadV4.Direction.Up, function () {
    bird.change(LedSpriteProperty.Y, -1)
})

gamepadV4.onJoystick(gamepadV4.Direction.Down, function () {
    bird.change(LedSpriteProperty.Y, 1)
})
```

Zdarzenie powstaje przy wejściu w dany kierunek. Aby wygenerować je ponownie, joystick musi wrócić w okolice środka albo przejść do innego kierunku.

## Dodawanie do MakeCode

Po opublikowaniu repozytorium na GitHubie:

1. Otwórz MakeCode dla micro:bita.
2. Wejdź w `Rozszerzenia`.
3. W polu wyszukiwania wklej adres repozytorium GitHub.
4. Wybierz rozszerzenie.

## Uwagi

P12 w tej wersji gamepada steruje jednocześnie silnikiem wibracyjnym i diodą LED. Zmiana siły wibracji przez PWM zmienia także jasność tej diody.

Domyślne progi joysticka to 300/700, z histerezą powrotu 400/600. Można je zmienić zaawansowanym blokiem `set joystick thresholds ...`.

## Licencja

MIT
