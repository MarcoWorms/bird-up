import { merge } from 'ramda'

const initialWallState = { x: 90, y: 60 }

const initialState = {
  bird: {
    y: 0,
    velocity: 0
  },
  walls: [initialWallState]
}

function birdUp (state, props) {
  console.log(state)
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
    walls: [...walls, initialWallState]
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

function update (state, props) {
  return [
    gravity,
    walls,
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
}
