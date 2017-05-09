import React, { Component } from 'react'
import { Bird, Wall } from './components'
import logic from './logic'

export default class App extends Component {
  constructor (props) {
    super(props)
    this.state = logic.initialState
  }
  enableJump () {
    this.props.bindKey('space', () =>
      this.setState(logic.birdUp)
    )
  }
  componentDidMount () {
    this.setState(logic.startUpdating.bind(this))
    this.setState(logic.startSpawningWalls.bind(this))
    this.enableJump()
  }
  render () {
    return <element>
      {this.state.walls.map(wall =>
        <Wall
          x={wall.x}
          y={wall.y}
        />
      )}
      {this.state.walls.map(wall =>
        <Wall
          x={wall.x}
          y={wall.y - 90}
        />
      )}
      <Bird
        y={this.state.bird.y}
      />
    </element>
  }
}
