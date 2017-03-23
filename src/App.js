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
  enableUpdate () {
    setInterval(
      () => this.setState(logic.update),
      1000 / this.props.fps
    )
  }
  enableWallSpawn () {
    setInterval(
      () => this.setState(logic.spawnWall),
      1000
    )
  }
  componentDidMount () {
    this.enableUpdate()
    this.enableJump()
    this.enableWallSpawn()
  }
  render () {
    return <element>
      {this.state.walls.map(wall =>
        <Wall
          x={wall.x}
          y={wall.y}
        />
      )}
      <Bird y={this.state.bird.y} />
    </element>
  }
}
