const initialState = {
  bird: {
    y: 0,
    velocity: 0
  }
}

function birdUp (state, props) {
  const { bird } = state
  return {
    bird: Object.assign({}, bird, {
      velocity: -1.3,
    })
  }
}

function gravity (state, props) {
  const { bird } = state
  return {
    bird: {
      velocity: bird.velocity + 0.17,
      y: Math.round(bird.y + bird.velocity),
    },
  }
}

export default {
  initialState,
  birdUp,
  gravity,
}
