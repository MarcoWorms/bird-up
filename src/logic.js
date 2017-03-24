import { merge } from 'ramda'

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

function restart () {
  return initialState
}

function birdUp (state, props) {
  const { bird } = state
  return {
    bird: merge(bird, {
      velocity: -4.3,
    })
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
    return restart()
  }
}

function update (state, props) {
  return [
    gravity,
    walls,
    birdOutsideScreen,
  ].reduce(
    (state, reducer) => merge(state, reducer(state, props)),
    state
  )
}

export default {
  initialState,
  birdUp,
  update,
  spawnWall,
  restart,
}
