export class InputManager {
  constructor() {
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false
    };
    
    this.enabled = false; // Disabled until game starts
    this.onEnterPress = null;
    this.onEscapePress = null;
    
    this.initKeyboard();
    this.initMobileControls();
  }

  initKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') {
        if (this.onEscapePress) this.onEscapePress();
        return;
      }

      if (!this.enabled) return;

      switch(e.code) {
        case 'ArrowUp':
        case 'KeyW':
          this.keys.forward = true;
          break;
        case 'ArrowDown':
        case 'KeyS':
          this.keys.backward = true;
          break;
        case 'ArrowLeft':
        case 'KeyA':
          this.keys.left = true;
          break;
        case 'ArrowRight':
        case 'KeyD':
          this.keys.right = true;
          break;
        case 'Enter':
        case 'NumpadEnter':
          if (this.onEnterPress) this.onEnterPress();
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      // Always allow keyup to prevent sticking keys
      switch(e.code) {
        case 'ArrowUp':
        case 'KeyW':
          this.keys.forward = false;
          break;
        case 'ArrowDown':
        case 'KeyS':
          this.keys.backward = false;
          break;
        case 'ArrowLeft':
        case 'KeyA':
          this.keys.left = false;
          break;
        case 'ArrowRight':
        case 'KeyD':
          this.keys.right = false;
          break;
      }
    });
  }

  initMobileControls() {
    const btnForward = document.getElementById('btn-forward');
    const btnBackward = document.getElementById('btn-backward');
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const btnAction = document.getElementById('btn-action');

    // Utility helper for touch start and end
    const bindPress = (element, keyProp) => {
      if (!element) return;
      
      const startPress = (e) => {
        e.preventDefault();
        if (!this.enabled) return;
        this.keys[keyProp] = true;
      };

      const endPress = (e) => {
        e.preventDefault();
        this.keys[keyProp] = false;
      };

      element.addEventListener('mousedown', startPress);
      element.addEventListener('mouseup', endPress);
      element.addEventListener('mouseleave', endPress);
      element.addEventListener('touchstart', startPress, { passive: false });
      element.addEventListener('touchend', endPress, { passive: false });
    };

    bindPress(btnForward, 'forward');
    bindPress(btnBackward, 'backward');
    bindPress(btnLeft, 'left');
    bindPress(btnRight, 'right');

    if (btnAction) {
      const triggerAction = (e) => {
        e.preventDefault();
        if (!this.enabled) return;
        if (this.onEnterPress) this.onEnterPress();
      };
      
      btnAction.addEventListener('click', triggerAction);
      btnAction.addEventListener('touchstart', triggerAction, { passive: false });
    }
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
    // Reset all keys to prevent continuous movement
    this.keys.forward = false;
    this.keys.backward = false;
    this.keys.left = false;
    this.keys.right = false;
  }
}
