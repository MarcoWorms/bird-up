export default {
  // The config object contains global configuration for the game
  config: {
    name: 'Flappy Bird',
    // The entry scene. Every time you send a string to a field that
    // has objects as params you are doing a syntax sugar for an
    // object with that id. for example, here we are doing:
    // { id: 'menu' }
    // this is important because you can always override previous props
    // for that object.
    entry: 'menu'
    default: {
      layouts: {
        // number = pixels
        width: 800,
        height: 600,
      },
    },
  },
  actors: [
    {
      id: 'bird',
      width: 64,
      height: 64,
      behaviours: [
        {
          type: 'physics',
          // pixels/s
          gravity: 100,
        },
        {
          type: 'destroyOutsideLayout',
        }
      ],
      css: {
        backgroundColor: 'orange',
      },
    },
    {
      id: 'wall',
      width: 64,
      height: 300,
      css: {
        backgroundColor: 'green',
      },
    },
    {
      id: 'walls',
      x: 800,
      y: 400,
      behaviours: [
        {
          type: 'bullet',
          direction: 180,
          speed: 300,
        }
      ],
      group: [
        {
          id: 'wall',
          // offset is an exclusive prop for groups. This allows
          // composing objects from another objects
          offset: {
            y: -400,
          },
        },
        {
          id: 'wall',
          offset: {
            y: 200,
          },
        },
      ],
    }
  ],
  subscriptions: [
    {
      id: 'spawn walls every X seconds',
      type: 'timer',
      interval: 1000,
      action: {
        $create: {
          id: 'walls',
          // this is random between 300 and 500
          y: '300~500',
        },
      },
    },
    {
      id: 'destroy bird on wall collision',
      type: 'collision',
      to: ['bird', 'walls'],
      action: {
        $destroy: 'bird',
      },
    },
    {
      id: 'restart game when bird destroyed',
      type: 'onDestroyed',
      to: 'bird',
      action: {
        $restart: 'menu',
      },
    }
    {
      id: 'flap bird on space pressed',
      type: 'keyboard',
      key: 'space',
      to: 'bird',
      action: {
        physics: {
          velocity: {
            y: -200
          }
        },
      },
    },
  ],
  layouts: [
    {
      id: 'menu',
      // needs more stuff here
    },
    {
      id: 'game',
      subscriptions: [
        // here we use the same syntax suggar that we did in the config
        'flap bird on space pressed',
        'spawn walls every X seconds',
        'destroy bird on wall collision',
        'restart game when bird destroyed',
      ],
      actors: [
        {
          id: 'bird',
          // this would override the bird props. you can always override
          // props when you send an object
          x: 0,
          y: 0,
        },
        // here we use the same syntax suggar that we did in the config
        'walls'
      ],
    },
  ],
}
