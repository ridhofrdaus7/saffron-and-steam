// Centralized InputManager abstracting keyboard, pointer/touch, and action buffering.
// Supports context switching between gameplay and modal overlays with full listener cleanup.

import { INPUT_BUFFER_MS } from './config.js';

export const DEFAULT_BINDINGS = Object.freeze({
  tomato: ['Digit1', 'Numpad1'],
  mushroom: ['Digit2', 'Numpad2'],
  shrimp: ['Digit3', 'Numpad3'],
  noodles: ['Digit4', 'Numpad4'],
  prep: ['Digit5', 'Numpad5'],
  pan0: ['Digit6', 'Numpad6'],
  pan1: ['Digit7', 'Numpad7'],
  pot: ['Digit8', 'Numpad8'],
  plate0: ['Digit9', 'Numpad9'],
  plate1: ['Digit0', 'Numpad0'],
  herbs: ['KeyG'],
  serve: ['Enter'],
  discard: ['KeyX'],
  recipes: ['KeyR'],
  help: ['KeyH'],
  pause: ['Space', 'Escape'],
});

export class InputManager {
  constructor(bindings = DEFAULT_BINDINGS) {
    this.bindings = bindings;
    this.codeToAction = new Map();
    for (const [action, codes] of Object.entries(bindings)) {
      for (const code of codes) {
        this.codeToAction.set(code, action);
      }
    }
    this.context = 'modal';
    this.buffer = [];
    this.listeners = new Set();
    this._onKeyDown = (e) => this.handleKeyDown(e);
    window.addEventListener('keydown', this._onKeyDown);
  }

  setContext(context) {
    this.context = context;
  }

  onAction(handler) {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }

  emit(action, source = 'pointer') {
    for (const listener of this.listeners) {
      listener(action, source);
    }
  }

  bufferAction(action, durationMs = INPUT_BUFFER_MS) {
    const expires = performance.now() + durationMs;
    this.buffer.push({ action, expires });
  }

  consumeBuffered() {
    const now = performance.now();
    while (this.buffer.length > 0) {
      const next = this.buffer.shift();
      if (next.expires >= now) {
        return next.action;
      }
    }
    return null;
  }

  handleKeyDown(e) {
    if (e.repeat) return;
    const action = this.codeToAction.get(e.code);
    if (!action) return;

    if (this.context === 'modal') {
      if (action === 'pause' || (action === 'recipes' && e.code === 'KeyR')) {
        e.preventDefault();
        this.emit('close_or_toggle', 'keyboard');
      }
      return;
    }

    e.preventDefault();
    this.emit(action, 'keyboard');
  }

  destroy() {
    window.removeEventListener('keydown', this._onKeyDown);
    this.listeners.clear();
    this.buffer.length = 0;
  }
}
