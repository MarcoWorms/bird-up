import {
  merge,
  pipe,
} from 'ramda'

const buildWall = () => ({
  x: 90,
  y: 70 + Math.floor(Math.random() * 30) - 15,
})

const initialState = {
  bird: {
    y: 0,
    velocity: 0
  },
  walls: [buildWall()]
}

function restart (state) {
  clearInterval(state.updateTimer)
  clearInterval(state.wallTimer)
  return pipe(
    startSpawningWalls.bind(this),
    startUpdating.bind(this)
  )(initialState)
}

function birdUp (state, props) {
  const { bird } = state
  return {
    bird: merge(bird, {
      velocity: -4.3,
    })
  }
}

function startSpawningWalls (state, props) {
  return {
    wallTimer: setInterval(
      () => this.setState(spawnWall),
      1300
    )
  }
}

function spawnWall (state, props) {
  const { walls } =  state
  return {
    walls: [...walls, buildWall()]
  }
}

function gravity (state, props) {
  const { bird } = state
  return {
    bird: {
      velocity: bird.velocity + 0.5,
      y: Math.round(bird.y + bird.velocity),
    },
  }
}

function walls (state, props) {
  const { walls } =  state
  return {
    walls: walls.map(wall =>
      merge(wall, { x: wall.x - 1 })
    )
  }
}

function birdOutsideScreen (state, props) {
  const { bird } = state
  if (bird.y < -1 || bird.y > 100) {
    return restart.bind(this)(state)
  }
}

function startUpdating (state, props) {
  return {
    updateTimer: setInterval(
      () => this.setState(update.bind(this)),
      1000 / 24
    )
  }
}

function update (state, props) {
  return [
    gravity,
    walls,
    birdOutsideScreen.bind(this),
  ].reduce(
    (state, reducer) => merge(state, reducer(state, props)),
    state
  )
}

export default {
  initialState,
  birdUp,
  startSpawningWalls,
  startUpdating,
}
