// Keyboard and mouse input: movement keys, sneak, grab, coin toss and clicks.
// The game reads this state each frame; nothing here knows about the game.

export function createInput(canvas) {
  const keys = new Set();
  const state = {
    keys,
    mouse: { x: 0, y: 0, clicked: false, clickX: 0, clickY: 0 },
    // Edge-triggered actions, consumed by the game once per press.
    pressed: new Set(),
  };

  const KEYMAP = {
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    ShiftLeft: 'sneak', ShiftRight: 'sneak',
    KeyE: 'grab',
    KeyQ: 'coin',
    Space: 'coin',
    KeyP: 'pause',
    KeyM: 'mute',
    Enter: 'confirm',
    Escape: 'back',
  };

  function onKeyDown(e) {
    const action = KEYMAP[e.code];
    if (!action) return;
    if (['up', 'down', 'left', 'right', 'sneak'].includes(action)) e.preventDefault();
    if (!e.repeat) state.pressed.add(action);
    keys.add(action);
  }
  function onKeyUp(e) {
    const action = KEYMAP[e.code];
    if (action) keys.delete(action);
  }
  function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    state.mouse.x = e.clientX - rect.left;
    state.mouse.y = e.clientY - rect.top;
  }
  function onMouseDown(e) {
    onMouseMove(e);
    state.mouse.clicked = true;
    state.mouse.clickX = state.mouse.x;
    state.mouse.clickY = state.mouse.y;
    state.pressed.add('click');
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mousedown', onMouseDown);

  // Movement vector from the held keys, normalised.
  state.moveVector = () => {
    let x = 0;
    let y = 0;
    if (keys.has('left')) x -= 1;
    if (keys.has('right')) x += 1;
    if (keys.has('up')) y -= 1;
    if (keys.has('down')) y += 1;
    if (x !== 0 && y !== 0) { x *= Math.SQRT1_2; y *= Math.SQRT1_2; }
    return { x, y };
  };

  state.isSneaking = () => keys.has('sneak');

  // True once per press; the game calls this each frame for each action.
  state.wasPressed = (action) => {
    if (state.pressed.has(action)) {
      state.pressed.delete(action);
      return true;
    }
    return false;
  };

  // Clear edge presses at the end of a frame so a press is never read twice.
  state.endFrame = () => { state.pressed.clear(); state.mouse.clicked = false; };

  return state;
}
